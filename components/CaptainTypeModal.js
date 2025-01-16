import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CaptainTypeModal({ isOpen, onClose, onSubmit, songTitle }) {
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [storedName, setStoredName] = useState(null);

  useEffect(() => {
    const savedName = localStorage.getItem('captainName');
    if (savedName) {
      setStoredName(savedName);
      setName(savedName);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type && name.trim()) {
      // Save name to localStorage if it's not already there
      if (!storedName) {
        localStorage.setItem('captainName', name.trim());
      }
      onSubmit(type, name.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Up as Captain</DialogTitle>
          <DialogDescription>
            Choose how you'd like to captain "{songTitle}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {!storedName && (
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Your Name
                </label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            )}
            <div className="grid gap-2">
              <label htmlFor="type" className="text-sm font-medium text-gray-700">
                Captain Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select captain type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Captain</SelectItem>
                  <SelectItem value="piano">Piano Captain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!type || (!storedName && !name.trim())}>
              Sign Up
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 