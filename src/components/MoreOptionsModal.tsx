// src/components/MoreOptionsModal.tsx
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface MoreOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReport: (reason: string) => void; // Modified to pass the reason
    onAddToPlaylist: () => void;
}

const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({ isOpen, onClose, onReport, onAddToPlaylist }) => {
  const [reportReason, setReportReason] = React.useState("");
  const [reportButtonDisabled, setReportButtonDisabled] = React.useState(false);

    const handleReportClick = () => {
      if (reportReason) {
            setReportButtonDisabled(true);
            onReport(reportReason);
      }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white border-none shadow-lg">
                <div className="flex items-center justify-between">
                     <DialogHeader>
                          <DialogTitle>More Options</DialogTitle>
                       </DialogHeader>
                       {/* <Button variant="ghost" size="icon" onClick={onClose}>
                             <X className="h-4 w-4" />
                       </Button> */}
                  </div>

                  <Button onClick={onAddToPlaylist} variant="ghost" className="w-full hover:bg-gray-700 hover:text-white py-2 rounded-md">
                        Add to Playlist
                 </Button>

             <div className="grid w-full max-w-sm items-center text-center justify-center gap-2">
                  <Label htmlFor="reportreason">Report Reason</Label>
                   <Select onValueChange={setReportReason} defaultValue={reportReason}>
                      <SelectTrigger className="w-full bg-gray-600">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                           <SelectGroup>
                              <SelectLabel>Category</SelectLabel>
                              <SelectItem value="inappropriate content">Inappropriate content</SelectItem>
                              <SelectItem value="Hate speech">Hate speech</SelectItem>
                              <SelectItem value="Copyright infringement">Copyright infringement</SelectItem>
                              <SelectItem value="Spam">Spam</SelectItem>
                              <SelectItem value="Misleading Content">Misleading Content</SelectItem>
                           </SelectGroup>
                      </SelectContent>
                   </Select>
            </div>

        <Button
            variant="ghost"
            className="w-full text-left hover:bg-gray-700 hover:text-white py-2 rounded-md"
            onClick={handleReportClick}
            disabled={reportButtonDisabled || !reportReason}  // Disable button if no reason selected
          >
               {reportButtonDisabled ? "Reporting..." : "Report Video"}
          </Button>

            </DialogContent>
        </Dialog>
    );
};

export default MoreOptionsModal;