import Papa from 'papaparse';
import Fuse from 'fuse.js';

// Function to normalize strings for comparison
const normalizeString = (str) => {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
};

// Function to check for exact duplicates
const isExactDuplicate = (song, existingSongs) => {
  const normalizedTitle = song.title.toLowerCase().trim();
  const normalizedArtist = song.artist.toLowerCase().trim();
  
  return existingSongs.some(existing => 
    existing.title.toLowerCase().trim() === normalizedTitle &&
    existing.artist.toLowerCase().trim() === normalizedArtist
  );
};

// Function to find fuzzy duplicates using Fuse.js
const findFuzzyDuplicates = (song, existingSongs) => {
  // Configure Fuse with our search options
  const fuseOptions = {
    includeScore: true,
    threshold: 0.3, // Lower threshold = stricter matching
    keys: [
      { name: 'title', weight: 0.7 }, // Title is more important
      { name: 'artist', weight: 0.3 }
    ]
  };

  const fuse = new Fuse(existingSongs, fuseOptions);
  
  // Search for matches
  const results = fuse.search({
    title: song.title,
    artist: song.artist
  });

  // Filter out exact matches and return only fuzzy matches with good scores
  return results
    .filter(result => result.score < 0.3) // Only return good matches
    .filter(result => !isExactDuplicate(song, [result.item]))
    .map(result => result.item);
};

export const EXAMPLE_CSV = `title,artist,type,tags,chordChart
Sweet Caroline,Neil Diamond,ballad,"favorite,easy",https://tabs.ultimate-guitar.com/tab/neil-diamond/sweet-caroline-chords-84485
Sweet Home Alabama,Lynyrd Skynyrd,banger,,https://tabs.ultimate-guitar.com/tab/lynyrd-skynyrd/sweet-home-alabama-chords-95700
Piano Man,Billy Joel,ballad,,https://tabs.ultimate-guitar.com/tab/billy-joel/piano-man-chords-89991`;

export const validateRow = (row, rowIndex) => {
  // Skip blank rows
  const isBlankRow = Object.values(row).every(value => !value?.toString().trim());
  if (isBlankRow) {
    return [];
  }

  const errors = [];
  
  // Check required fields
  if (!row.title?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Missing title`);
  }
  if (!row.artist?.trim()) {
    errors.push(`Row ${rowIndex + 1}: Missing artist`);
  }

  // Validate type if provided
  if (row.type && !['banger', 'ballad'].includes(row.type.toLowerCase())) {
    errors.push(`Row ${rowIndex + 1}: Type must be either 'banger' or 'ballad', got '${row.type}'`);
  }

  // Validate tags format if provided
  if (row.tags && typeof row.tags === 'string') {
    const tags = row.tags.split(',').map(t => t.trim());
    if (tags.some(tag => !tag.match(/^[a-zA-Z0-9-]+$/))) {
      errors.push(`Row ${rowIndex + 1}: Tags must contain only letters, numbers, and hyphens`);
    }
  }

  // Validate chord URL if provided
  if (row.chordChart && typeof row.chordChart === 'string') {
    try {
      new URL(row.chordChart);
    } catch (e) {
      errors.push(`Row ${rowIndex + 1}: Invalid chord URL format`);
    }
  }

  return errors;
};

export const processCSV = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    if (file.type !== 'text/csv') {
      reject(new Error('Please upload a CSV file'));
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('Error parsing CSV file. Please check the format.'));
          return;
        }

        // Validate required fields in headers
        const requiredFields = ['title', 'artist'];
        const headers = Object.keys(results.data[0] || {});
        const missingFields = requiredFields.filter(field => !headers.includes(field));

        if (missingFields.length > 0) {
          reject(new Error(`Missing required columns: ${missingFields.join(', ')}`));
          return;
        }

        // Validate each row
        const validationErrors = [];
        results.data.forEach((row, index) => {
          const rowErrors = validateRow(row, index);
          validationErrors.push(...rowErrors);
        });

        if (validationErrors.length > 0) {
          reject(new Error(`Validation errors:\n${validationErrors.join('\n')}`));
          return;
        }

        resolve({
          totalRows: results.data.length,
          sampleRows: results.data.slice(0, 3),
          allRows: results.data
        });
      },
      error: (error) => {
        reject(new Error('Failed to parse CSV file: ' + error.message));
      }
    });
  });
};

export const processImport = (file, existingSongs = []) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Filter out blank rows and process remaining rows
        const nonBlankRows = results.data.filter(row => 
          !Object.values(row).every(value => !value?.toString().trim())
        );

        // Process each non-blank row and create songs
        const processedSongs = nonBlankRows.map(row => ({
          title: row.title?.trim(),
          artist: row.artist?.trim(),
          type: row.type?.toLowerCase() === 'banger' ? 'banger' : 'ballad',
          tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
          chordChart: row.chordChart?.trim() || null
        }));

        // Filter out invalid songs and check for duplicates
        const validSongs = [];
        const exactDuplicates = [];
        const fuzzyDuplicates = [];
        const invalidSongs = [];

        processedSongs.forEach(song => {
          if (!song.title || !song.artist) {
            invalidSongs.push(song);
            return;
          }

          if (isExactDuplicate(song, existingSongs)) {
            exactDuplicates.push(song);
            return;
          }

          const foundFuzzyDuplicates = findFuzzyDuplicates(song, existingSongs);
          if (foundFuzzyDuplicates.length > 0) {
            fuzzyDuplicates.push({
              newSong: song,
              possibleDuplicates: foundFuzzyDuplicates
            });
          }

          validSongs.push(song);
        });

        if (validSongs.length === 0 && exactDuplicates.length === 0 && fuzzyDuplicates.length === 0) {
          reject(new Error('No valid songs found in CSV'));
          return;
        }

        resolve({
          totalProcessed: processedSongs.length,
          added: validSongs.length,
          skipped: exactDuplicates.length,
          invalid: invalidSongs.length,
          songs: validSongs,
          exactDuplicates,
          fuzzyDuplicates
        });
      },
      error: (error) => {
        reject(new Error('Failed to process CSV: ' + error.message));
      }
    });
  });
}; 