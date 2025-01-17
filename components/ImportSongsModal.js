import { useState } from 'react';
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
import { EXAMPLE_CSV, processCSV, processImport } from '@/lib/importSongs';

export default function ImportSongsModal({ isOpen, onClose, onImport, jamId, allSongs = [] }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [fuzzyDuplicateDecisions, setFuzzyDuplicateDecisions] = useState({});
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);

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

    try {
      if (!currentFile) {
        setError('No file selected');
        return;
      }

      const result = await processImport(currentFile, allSongs);
      
      if (result.fuzzyDuplicates.length > 0) {
        // Initialize decisions for each fuzzy duplicate
        const initialDecisions = {};
        result.fuzzyDuplicates.forEach((duplicate, index) => {
          initialDecisions[index] = 'undecided';
        });
        setFuzzyDuplicateDecisions(initialDecisions);
        setShowDuplicateReview(true);
        setImportResults(result);
      } else {
        // No fuzzy duplicates, proceed with import
        await onImport(result.songs);
        setImportResults(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalizeDuplicates = async () => {
    if (!importResults) return;

    const approvedSongs = [...importResults.songs];

    // Add songs that were approved in the fuzzy duplicate review
    importResults.fuzzyDuplicates.forEach((duplicate, index) => {
      if (fuzzyDuplicateDecisions[index] === 'approve') {
        approvedSongs.push(duplicate.newSong);
      }
    });

    await onImport(approvedSongs);
    setShowDuplicateReview(false);
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
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Review Potential Duplicates</h3>
        <p className="text-sm text-gray-600">
          We found some songs that might be duplicates. Please review them before finalizing the import.
        </p>
        
        {importResults.fuzzyDuplicates.map((duplicate, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">New Song</h4>
                <p>{duplicate.newSong.title} - {duplicate.newSong.artist}</p>
                
                <h4 className="font-medium mt-2">Possible Duplicates</h4>
                <ul className="list-disc list-inside">
                  {duplicate.possibleDuplicates.map((existing, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      {existing.title} - {existing.artist}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant={fuzzyDuplicateDecisions[index] === 'approve' ? 'default' : 'outline'}
                  onClick={() => setFuzzyDuplicateDecisions(prev => ({
                    ...prev,
                    [index]: 'approve'
                  }))}
                >
                  Import Anyway
                </Button>
                <Button
                  size="sm"
                  variant={fuzzyDuplicateDecisions[index] === 'skip' ? 'default' : 'outline'}
                  onClick={() => setFuzzyDuplicateDecisions(prev => ({
                    ...prev,
                    [index]: 'skip'
                  }))}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setShowDuplicateReview(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFinalizeDuplicates}
            disabled={Object.values(fuzzyDuplicateDecisions).some(d => d === 'undecided')}
          >
            Finalize Import
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isProcessing) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Songs from CSV</DialogTitle>
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
                <li><code>chordUrl</code> - URL to chord sheet/tab (e.g. Ultimate Guitar link)</li>
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
        </DialogHeader>

        {showDuplicateReview ? (
          renderDuplicateReview()
        ) : (
          <div className="space-y-4">
            {!importResults && !isProcessing && (
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

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
                  </Alert>
                )}

                {preview && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Preview ({preview.totalRows} songs found)</h4>
                    <div className="text-sm text-gray-600">
                      {preview.sampleRows.map((row, i) => (
                        <div key={i} className="py-1">
                          {row.title} - {row.artist} ({row.type || 'ballad'})
                          {row.tags && <span className="text-gray-400"> • {row.tags}</span>}
                          {row.chordUrl && (
                            <span className="text-gray-400">
                              {' '}• <a href={row.chordUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">chords</a>
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
              </>
            )}

            {isProcessing && (
              <Alert className="bg-blue-50 border-blue-200">
                <div className="flex items-center space-x-3">
                  <Spinner className="text-indigo-500" />
                  <p className="text-indigo-800">
                    Importing songs... Please do not close this window. This may take a few moments.
                  </p>
                </div>
              </Alert>
            )}

            {importResults && !importResults.fuzzyDuplicates.length && (
              <Alert className="bg-green-50 border-green-200">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800">Import Complete!</h4>
                  <div className="text-green-700">
                    <p>Successfully processed {importResults.totalProcessed} songs:</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>{importResults.added} songs were added</li>
                      {importResults.skipped > 0 && (
                        <li>{importResults.skipped} exact duplicates were skipped</li>
                      )}
                      {importResults.invalid > 0 && (
                        <li>{importResults.invalid} invalid songs were skipped</li>
                      )}
                    </ul>
                  </div>
                </div>
              </Alert>
            )}

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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 