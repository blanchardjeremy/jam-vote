import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { EXAMPLE_CSV, processCSV, processImport } from '@/lib/importSongs';
import { toast } from 'sonner';
import { createSongsBulk } from '@/lib/services/songs';
import { PlusIcon } from '@heroicons/react/24/outline';

function DuplicateReview({ 
  importResults, 
  fuzzyDuplicateDecisions, 
  setFuzzyDuplicateDecisions, 
  onCancel, 
  onFinalize,
  isProcessing 
}) {
  const handleBulkAction = (action) => {
    const newDecisions = {};
    importResults.fuzzyDuplicates.forEach((_, index) => {
      newDecisions[index] = action;
    });
    setFuzzyDuplicateDecisions(newDecisions);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Review Potential Duplicates</h3>
          <p className="text-sm text-gray-600">
            We found some songs that might be duplicates. Please review them before finalizing the import.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction('skip')}
            disabled={isProcessing}
          >
            Skip All
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkAction('approve')}
            disabled={isProcessing}
          >
            <PlusIcon className="h-4 w-4" />
            Import All
          </Button>
        </div>
      </div>
      
      {importResults.fuzzyDuplicates.map((duplicate, index) => (
        <div key={index} className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-xl font-semibold">{duplicate.newSong.title}</div>
                <div className="text-gray-600">{duplicate.newSong.artist}</div>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={fuzzyDuplicateDecisions[index] === 'approve' ? 'success' : 'outline'}
                  onClick={() => setFuzzyDuplicateDecisions(prev => ({
                    ...prev,
                    [index]: 'approve'
                  }))}
                  disabled={isProcessing}
                >
                  <PlusIcon className="h-4 w-4" />
                  Import Anyway
                </Button>
                <Button
                  size="sm"
                  variant={fuzzyDuplicateDecisions[index] === 'skip' ? 'secondary' : 'outline'}
                  onClick={() => setFuzzyDuplicateDecisions(prev => ({
                    ...prev,
                    [index]: 'skip'
                  }))}
                  disabled={isProcessing}
                >
                  Skip
                </Button>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 mb-3">Possible duplicate of:</div>
              <ul className="space-y-2">
                {duplicate.possibleDuplicates.map((existing, i) => (
                  <li key={i} className="bg-white p-2.5 rounded border">
                    <div className="font-medium">{existing.title}</div>
                    <div className="text-sm text-gray-600">{existing.artist}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          onClick={onFinalize}
          disabled={isProcessing || Object.values(fuzzyDuplicateDecisions).some(d => d !== 'approve' && d !== 'skip')}
        >
          {isProcessing ? 'Importing...' : 'Finalize Import'}
        </Button>
      </div>
    </div>
  );
}

export default function ImportSongsModal({ isOpen, onClose, onSuccess, allSongs = [] }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [fuzzyDuplicateDecisions, setFuzzyDuplicateDecisions] = useState({});
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [progress, setProgress] = useState(0);

  const resetState = () => {
    setIsProcessing(false);
    setError(null);
    setPreview(null);
    setIsDragging(false);
    setCurrentFile(null);
    setImportResults(null);
    setFuzzyDuplicateDecisions({});
    setShowDuplicateReview(false);
    setProgress(0);
  };

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const processFile = async (file) => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setCurrentFile(file);

    try {
      const result = await processCSV(file);
      setPreview(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      if (!currentFile) {
        setError('No file selected');
        return;
      }

      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Cap at 90% until complete
          return prev + 10;
        });
      }, 500);

      const result = await processImport(currentFile, allSongs);
      
      if (result.fuzzyDuplicates.length > 0) {
        clearInterval(progressInterval);
        setProgress(0);
        
        // Initialize decisions for each fuzzy duplicate
        const initialDecisions = {};
        result.fuzzyDuplicates.forEach((duplicate, index) => {
          initialDecisions[index] = 'undecided';
        });
        setFuzzyDuplicateDecisions(initialDecisions);
        setShowDuplicateReview(true);
        
        // Separate non-duplicate songs from potential duplicates
        const nonDuplicateSongs = result.songs.filter(song => 
          !result.fuzzyDuplicates.some(dup => 
            dup.newSong.title === song.title && dup.newSong.artist === song.artist
          )
        );
        
        setImportResults({
          ...result,
          songs: nonDuplicateSongs
        });
      } else {
        // No fuzzy duplicates, proceed with import
        await importSongs(result.songs);
        clearInterval(progressInterval);
        setProgress(100);
        setImportResults(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const importSongs = async (songs) => {
    try {
      const { results, errors } = await createSongsBulk(songs);
      
      if (errors.length > 0) {
        console.error('Some songs failed to import:', errors);
        toast.error(`${errors.length} songs failed to import`);
      }
      
      toast.success('Songs imported successfully');
      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      console.error('Error importing songs:', e);
      toast.error('Failed to import songs');
      throw e;
    }
  };

  const handleFinalizeDuplicates = async () => {
    if (!importResults) return;

    setIsProcessing(true);
    setShowDuplicateReview(false);
    setProgress(0);
    
    const approvedSongs = [...importResults.songs];
    let approvedDuplicates = 0;
    let skippedDuplicates = 0;

    // Start progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev; // Cap at 90% until complete
        return prev + 10;
      });
    }, 500);

    // Count approved and skipped duplicates
    importResults.fuzzyDuplicates.forEach((duplicate, index) => {
      if (fuzzyDuplicateDecisions[index] === 'approve') {
        approvedSongs.push(duplicate.newSong);
        approvedDuplicates++;
      } else if (fuzzyDuplicateDecisions[index] === 'skip') {
        skippedDuplicates++;
      }
    });

    try {
      const { results, errors } = await createSongsBulk(approvedSongs);
      
      if (errors.length > 0) {
        console.error('Some songs failed to import:', errors);
        setError(`${errors.length} songs failed to import`);
      }
      
      setImportResults({
        ...importResults,
        totalProcessed: approvedSongs.length,
        added: importResults.songs.length,
        approvedDuplicates,
        skippedDuplicates,
        errors: errors.length
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      console.error('Error importing songs:', e);
      setError('Failed to import songs');
      throw e;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadExample = () => {
    const blob = new Blob([EXAMPLE_CSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'example-songs.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderDuplicateReview = () => {
    if (!showDuplicateReview || !importResults) return null;

    return (
      <DuplicateReview
        importResults={importResults}
        fuzzyDuplicateDecisions={fuzzyDuplicateDecisions}
        setFuzzyDuplicateDecisions={setFuzzyDuplicateDecisions}
        onCancel={() => setShowDuplicateReview(false)}
        onFinalize={handleFinalizeDuplicates}
        isProcessing={isProcessing}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isProcessing) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Songs from CSV</DialogTitle>
          {!preview && !importResults && !isProcessing && !showDuplicateReview && (
            <>
              <DialogDescription>
                Upload a CSV file with the following columns:
              </DialogDescription>
              <div className="mt-2 space-y-2">
                <div className="bg-gray-50 p-3 rounded-md text-sm space-y-1">
                  <div><strong>Required columns:</strong></div>
                  <ul className="list-disc list-inside">
                    <li><code>title</code> - Song title</li>
                    <li><code>artist</code> - Artist name</li>
                  </ul>
                  <div><strong>Optional columns:</strong></div>
                  <ul className="list-disc list-inside">
                    <li><code>type</code> - Either 'banger' or 'ballad' (defaults to 'ballad')</li>
                    <li><code>tags</code> - Comma-separated list of tags (e.g. "rock,guitar,karaoke")</li>
                    <li><code>chordChart</code> - URL to chord sheet/tab (e.g. Ultimate Guitar link)</li>
                  </ul>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadExample}
                  >
                    Download Example CSV
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {!preview && !importResults && !isProcessing && !showDuplicateReview && (
            <>
              <div 
                className="flex items-center justify-center w-full"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <label 
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  } border-dashed rounded-lg cursor-pointer transition-colors duration-150`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    
                    // Only set isDragging to false if we've actually left the bounds of the element
                    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
                      setIsDragging(false);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    processFile(file);
                  }}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className={`w-8 h-8 mb-4 ${isDragging ? 'text-indigo-500' : 'text-gray-500'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                    </svg>
                    <p className={`mb-2 text-sm ${isDragging ? 'text-indigo-600' : 'text-gray-500'}`}>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-xs ${isDragging ? 'text-indigo-500' : 'text-gray-500'}`}>CSV files only</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv" 
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                  />
                </label>
              </div>
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {preview && !importResults && !showDuplicateReview && (
            <div className="space-y-2">
              <h4 className="font-medium">Preview ({preview.totalRows} songs found)</h4>
              <div className="text-sm text-gray-600">
                {preview.sampleRows.map((row, i) => (
                  <div key={i} className="py-1">
                    {row.title} - {row.artist} ({row.type || 'ballad'})
                    {row.tags && <span className="text-gray-400"> • {row.tags}</span>}
                    {row.chordChart && (
                      <span className="text-gray-400">
                        {' '}• <a href={row.chordChart} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">chords</a>
                      </span>
                    )}
                  </div>
                ))}
                {preview.totalRows > 3 && (
                  <div className="text-gray-400 italic">
                    ...and {preview.totalRows - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {isProcessing && (
            <Alert className="bg-blue-50 border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Spinner className="text-indigo-500" />
                  <p className="text-indigo-800">
                    Importing songs... Please do not close this window. This may take a few moments.
                  </p>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </Alert>
          )}

          {!isProcessing && importResults && !showDuplicateReview && (
            <Alert variant="success">
              <div className="space-y-2">
                <h4 className="font-medium text-success">Import Complete!</h4>
                <div>
                  <p>Successfully processed {importResults.totalProcessed} songs:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>{importResults.added} songs were added</li>
                    {importResults.approvedDuplicates > 0 && (
                      <li>{importResults.approvedDuplicates} duplicates were imported</li>
                    )}
                    {importResults.skippedDuplicates > 0 && (
                      <li>{importResults.skippedDuplicates} duplicates were skipped</li>
                    )}
                    {importResults.errors > 0 && (
                      <li className="text-destructive">{importResults.errors} songs failed to import</li>
                    )}
                  </ul>
                </div>
              </div>
            </Alert>
          )}

          {showDuplicateReview ? (
            renderDuplicateReview()
          ) : (
            <div className="flex justify-end gap-3">
              {!importResults ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Please wait...' : 'Cancel'}
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={!preview || isProcessing}
                  >
                    {isProcessing ? 'Importing...' : 'Import Songs'}
                  </Button>
                </>
              ) : (
                <Button onClick={onClose}>Close</Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 