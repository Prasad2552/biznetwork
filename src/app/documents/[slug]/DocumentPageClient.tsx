"use client";

import { useState, useEffect } from "react";
import type { PDFDocument } from "@/types/pdf";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useContent } from "@/hooks/use-content";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import ShareModal from "@/components/ShareModal";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useChannelFollow } from "@/hooks/useChannelFollow";
import DOMPurify from "dompurify";

interface DocumentPageClientProps {
  document: PDFDocument;
  relatedDocuments: PDFDocument[];
}

const DEBUG_MODE = true; // KEEP TRUE for testing this iteration

export default function DocumentPageClient({
  document,
  relatedDocuments,
}: DocumentPageClientProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [extractedHtmlStyles, setExtractedHtmlStyles] = useState("");
  const [contentHtmlBody, setContentHtmlBody] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: session } = useSession();
  const { savedContent } = useContent();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSidebarItem, setActiveSidebarItem] = useState("");
  const [activeNavItem] = useState("All");
  const { isFollowing, toggleFollow, isLoading: followLoading } = useChannelFollow(document.channelId);

  useEffect(() => {
    if (savedContent.find((item) => item._id === document.id)) {
      setIsSaved(true);
    } else {
      setIsSaved(false);
    }
  }, [savedContent, document.id]);

  // Effect for fetching and processing HTML content
  useEffect(() => {
    if (!document?.content) {
      setError("No content URL provided");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setExtractedHtmlStyles("");
    setContentHtmlBody("");
    if (DEBUG_MODE) console.log("[DEBUG] Content Fetch: URL", document.content);

    fetch(document.content)
      .then(res => {
        if (!res.ok) return Promise.reject(new Error(`Fetch HTML Error: ${res.status} from ${document.content}`));
        return res.text();
      })
      .then(html => {
        if (!html) throw new Error("Fetched HTML is empty");
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        if (DEBUG_MODE) console.log("[DEBUG] Content Fetch: Raw body (1k chars)", doc.body.innerHTML.slice(0, 1000));
        
        if (!doc.body.innerHTML.trim() && !doc.head.innerHTML.trim()) { // Check if both are empty
          throw new Error("Fetched HTML head & body are empty or only whitespace.");
        }

        let styles = "";
        doc.querySelectorAll("style").forEach(s => { styles += s.innerHTML + "\n"; s.remove(); });
        if (DEBUG_MODE && styles) console.log("[DEBUG] Content Fetch: Extracted <style> (500 chars)", styles.slice(0,500));
        setExtractedHtmlStyles(styles);
        
        let bodySrc = doc.body.innerHTML; // Default to full body
        // Try to find a common main container if body itself is just a shell
        const mainPdfContainer = doc.body.querySelector('#page-container, #pf1, .page-container, .pc, .absimg') as HTMLElement; // Add more common PDF export wrapper selectors
        if (mainPdfContainer && doc.body.children.length === 1 && mainPdfContainer === doc.body.firstElementChild) {
             if (DEBUG_MODE) console.log("[DEBUG] Content Fetch: Using content from main PDF container:", mainPdfContainer.id || mainPdfContainer.className);
             bodySrc = mainPdfContainer.innerHTML; // Get content of this container
        } else if (doc.body.children.length === 1 && doc.body.children[0].tagName === 'DIV' && (doc.body.textContent || "").trim().length < 100 && doc.body.children[0].innerHTML.trim().length > 0 ) {
            if (DEBUG_MODE) console.log("[DEBUG] Content Fetch: Using content from single wrapper DIV in body.");
            bodySrc = doc.body.children[0].innerHTML;
        }
        // If after all that, bodySrc is empty but doc.body.innerHTML wasn't, revert to full body
        if (!bodySrc.trim() && doc.body.innerHTML.trim()) {
            if (DEBUG_MODE) console.log("[DEBUG] Content Fetch: bodySrc became empty, reverting to full doc.body.innerHTML");
            bodySrc = doc.body.innerHTML;
        }


        const saneOpts = { 
            ADD_TAGS: ['div', 'span', 'p', 'img', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'br', 'hr', 'strong', 'em', 'u', 's', 'sub', 'sup', 'blockquote', 'pre', 'code', 'figure', 'figcaption', 'section', 'article', 'header', 'footer', 'main', 'aside', 'nav', 'svg', 'path', 'g', 'rect', 'circle', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs', 'clippath', 'image', 'use'], 
            ADD_ATTR: ['class', 'id', 'style', 'src', 'href', 'width', 'height', 'alt', 'title', 'data-page-no', 'colspan', 'rowspan', 'type', 'start', 'xmlns', 'viewbox', 'd', 'fill', 'stroke', 'stroke-width', 'transform', 'clip-path', 'x', 'y', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'points', 'preserveaspectratio', 'xlink:href', 'data-original-width', 'data-original-height'], 
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'input', 'button', 'select', 'textarea', 'option'], 
            FORBID_ATTR: ['onmouse*', 'onkey*', 'onfocus', 'onblur', 'onload', 'onerror', 'onclick', 'ondblclick', 'onchange', 'onsubmit', 'oninput', 'onscroll', 'onwheel', 'ondrag*', 'ondrop*'],
            ALLOW_DATA_ATTR: true, 
            WHOLE_DOCUMENT: false, 
            RETURN_DOM_FRAGMENT: false, 
            ALLOW_UNKNOWN_PROTOCOLS: true 
        };
        const saneBody = DOMPurify.sanitize(bodySrc, saneOpts);
        if (DEBUG_MODE) console.log("[DEBUG] Content Fetch: Sanitized body (1k chars)", saneBody.slice(0, 1000));
        
        if (!saneBody.trim() && bodySrc.trim()) {
            setContentHtmlBody("<p style='color:red; font-weight:bold;'>[DEBUG] Content became empty after sanitization. Original bodySrc had content.</p>");
        } else if (!saneBody.trim()) {
            setContentHtmlBody("<p style='color:red; font-weight:bold;'>[DEBUG] Processed HTML content is empty (original bodySrc was also likely empty or whitespace).</p>");
        } else {
            setContentHtmlBody(saneBody);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Content Fetch Error:", err);
        setError(err.message);
        setContentHtmlBody(`<p style='color:red;'>Error loading content: ${err.message}</p>`);
        setIsLoading(false);
      });
  }, [document?.content, document?.id]);

  // Effect for scaling the content
  useEffect(() => {
    const updateScales = (isFinalAttempt = false) => {
      if (typeof window === "undefined" || !contentHtmlBody) return;
      const pdfContentHost = window.document.querySelector('.pdf-render-area .pdf-content-host') as HTMLElement;
      if (!pdfContentHost) { if (DEBUG_MODE) console.warn("updateScales: .pdf-content-host missing"); return; }

      // --- TARGETING THE PAGE BOX ELEMENT ---
      // Try to find a specific page box. Adapt selectors as needed.
      // Common pdf2htmlEX: 'div.pf' (page frame), often with ID 'pfX'
      // Sometimes a single '#page-container' might wrap everything.
      // Or it could be the first significant DIV child.
      let pageBoxElement = pdfContentHost.querySelector('div.pf, #page-container, div.page') as HTMLElement | null; 
      if (!pageBoxElement) {
          pageBoxElement = pdfContentHost.firstElementChild as HTMLElement | null;
           if (pageBoxElement && pageBoxElement.children.length === 1 && pageBoxElement.firstElementChild?.id === 'page-container' ) {
             pageBoxElement = pageBoxElement.firstElementChild as HTMLElement; // Go one level deeper if first child is a simple wrapper for #page-container
          }
      }
      
      if (!pageBoxElement) { 
          if (DEBUG_MODE) console.warn("updateScales: no identifiable pageBoxElement found in .pdf-content-host"); 
          return; 
      }
      if (DEBUG_MODE) console.log("[DEBUG] updateScales: Identified pageBoxElement:", pageBoxElement.id || pageBoxElement.className.split(" ")[0] || pageBoxElement.tagName);
      // --- END TARGETING ---


      const images = Array.from(pageBoxElement.querySelectorAll('img'));
      const allLoaded = images.every(img => img.complete && img.naturalHeight !== 0);
      if (!allLoaded && !isFinalAttempt) { if (DEBUG_MODE) console.log("updateScales: images pending..."); return; }
      if (DEBUG_MODE && isFinalAttempt && !allLoaded) console.warn("updateScales: final attempt, images may not be fully loaded.");

      let originalWidth = 0;
      if (pageBoxElement.style.width && pageBoxElement.style.width.endsWith('px')) {
          originalWidth = parseFloat(pageBoxElement.style.width);
      }
      if ((!originalWidth || originalWidth < 100) && pageBoxElement.offsetWidth > 0) { // Check offsetWidth if style.width is not reliable
          originalWidth = pageBoxElement.offsetWidth;
      }
      const dataOrigWidth = pageBoxElement.getAttribute('data-original-width') || pageBoxElement.dataset.originalWidth;
      if (dataOrigWidth && (!originalWidth || originalWidth < 100) ) {
          originalWidth = parseFloat(dataOrigWidth);
      }
      if (!originalWidth || originalWidth < 100 || isNaN(originalWidth)) originalWidth = 800;

      const containerWidth = pdfContentHost.clientWidth;
      if (containerWidth === 0) { if (DEBUG_MODE) console.warn("updateScales: pdfContentHost zero clientWidth"); return; }
      const scale = (originalWidth > 0) ? containerWidth / originalWidth : 1;

      // Apply styles for scaling to the pageBoxElement
      pageBoxElement.style.transformOrigin = 'top left';
      pageBoxElement.style.position = 'absolute'; // For precise placement if pdfContentHost is relative
      pageBoxElement.style.top = '0';
      pageBoxElement.style.left = '0';
      pageBoxElement.style.webkitBackfaceVisibility = 'hidden'; // May help with rendering artifacts
      pageBoxElement.style.backfaceVisibility = 'hidden'; // May help with rendering artifacts
      
      const originalTransform = pageBoxElement.style.transform;
      pageBoxElement.style.transform = 'none'; // Reset for measurement
      
      // We DON'T set pageBoxElement.style.width here because its original width should be intrinsic or from its inline style.
      // If we set it, scrollHeight might be based on a temporary state.

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = pageBoxElement.offsetHeight; 
      let naturalHeight = pageBoxElement.scrollHeight;

      if (pageBoxElement.style.height && pageBoxElement.style.height.endsWith('px')) {
          const styledHeight = parseFloat(pageBoxElement.style.height);
          if (styledHeight > 0 && styledHeight > naturalHeight - 5 && styledHeight < naturalHeight + 50) { // Heuristic: if styled height is close to scrollHeight, prefer it
             naturalHeight = styledHeight;
             if(DEBUG_MODE) console.log("[DEBUG] updateScales: Using styledHeight for naturalHeight:", naturalHeight);
          }
      }
      
      // Apply scale, potentially combining with existing transforms if any (though usually not needed)
      pageBoxElement.style.transform = `scale(${scale})`; 
      pageBoxElement.style.overflow = 'hidden'; // The page box itself should clip its content

      const calculatedHeight = naturalHeight * scale;
      let finalHeight = calculatedHeight - 1.0; // Fudge factor
      finalHeight = Math.max(0, finalHeight);

      pdfContentHost.style.height = `${finalHeight}px`;
      pdfContentHost.style.overflow = 'hidden'; // Host also clips

      if (DEBUG_MODE) console.log(`updateScales: Target: ${pageBoxElement.id || pageBoxElement.className.split(' ')[0]}, Sc: ${scale.toFixed(3)}, OW: ${originalWidth.toFixed(0)}, NH: ${naturalHeight.toFixed(0)}, CH: ${calculatedHeight.toFixed(2)}, FH: ${finalHeight.toFixed(2)}, SetH: ${pdfContentHost.style.height}. ImgL: ${allLoaded}. Final: ${isFinalAttempt}`);
      
      // translateZ nudge
      requestAnimationFrame(() => {
        const currT = pageBoxElement.style.transform;
        if (currT?.includes('scale')) {
          pageBoxElement.style.transform += ' translateZ(0)';
          requestAnimationFrame(() => pageBoxElement.style.transform = currT);
        }
      });
    };

    if (contentHtmlBody && !isLoading) {
      let pTimer: NodeJS.Timeout, sTimer: NodeJS.Timeout, tTimer: NodeJS.Timeout;
      const sched = () => { 
        clearTimeout(pTimer); clearTimeout(sTimer); clearTimeout(tTimer);
        pTimer = setTimeout(() => requestAnimationFrame(() => updateScales(false)), 400); // Increased delays
        sTimer = setTimeout(() => requestAnimationFrame(() => updateScales(false)), 1000);
        tTimer = setTimeout(() => requestAnimationFrame(() => updateScales(true)), 2000);
      };
      sched();
      const handleResize = () => { if (DEBUG_MODE) console.log("Resize event."); sched(); };
      window.addEventListener('resize', handleResize);
      return () => { clearTimeout(pTimer); clearTimeout(sTimer); clearTimeout(tTimer); window.removeEventListener('resize', handleResize); };
    }
  }, [contentHtmlBody, isLoading]);

  const handleBookmark = async () => { /* ... same as before ... */ };
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/documents/${document.slug}` : "";
  const channelLogo = document.channelLogo || "/Uploads/companyLogo_1732956327585_Ellipse 117.png";
  const channelName = document.channelName || "TCS";

  const layoutStyles = `
    .pdf-render-area { 
      margin: 0 auto;
      max-width: 800px; 
    }
    .pdf-content-host { 
      width: 100%;
      position: relative; /* Crucial for positioning pageBoxElement */
      background-color: #fff; 
      /* overflow: hidden; -- set by JS */
    }
    /* Universal border-box and remove unexpected margins/padding for children of host */
    .pdf-content-host *, .pdf-content-host ::before, .pdf-content-host ::after {
      box-sizing: border-box !important;
      /* margin: 0 !important; */ /* Be careful with this, might break intended layout */
      /* padding: 0 !important; */ /* Be careful with this */
    }
    /* Styles for the actual page box if it's identified (example for pdf2htmlEX 'pf' class) */
    /* .pdf-content-host div.pf {
        margin: 0 !important; 
        Ensures no extra margins interfere with scaling or host height
    } */
  `;

  return (
    <div className="flex min-h-screen bg-gray-50 font-poppins">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} activeSidebarItem={activeSidebarItem} setActiveSidebarItem={setActiveSidebarItem} />
      <div className="flex-1">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} activeNavItem={activeNavItem} isLoggedIn={!!session?.user} />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="max-w-full mx-auto"> {/* Let .pdf-render-area define its max-width */}
              <div className="mb-6 sm:mb-8"><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{document.title || "Untitled Document"}</h1></div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200"> {/* Header section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Image className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" src={channelLogo} alt={`${channelName} logo`} width={48} height={48} onError={(e) => { (e.target as HTMLImageElement).src = "/Uploads/companyLogo_1732956327585_Ellipse 117.png"; }} />
                      <div><p className="text-md sm:text-lg font-medium text-gray-900">{channelName}</p>{/*<p className="text-xs sm:text-sm text-gray-500 mt-1">Lorem ipsum dolor sit amet, consectetur. Amet.</p>*/}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-center">
                      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}><DialogTrigger asChild><Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100"><Image src="/Uploads/Share.png" alt="Share" width={38} height={38} /></Button></DialogTrigger><DialogContent><ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} shareUrl={shareUrl} title={document?.title || "Check out this post!"} /></DialogContent></Dialog>
                      <Button variant="ghost" size="icon" onClick={handleBookmark} disabled={!session?.user?.id} className="rounded-full hover:bg-gray-100"><Image src={isSaved ? "/Uploads/filledsaved.svg" : "/Uploads/Save.png"} alt="Save" width={38} height={38} /></Button>
                      <Button variant="default" className="bg-[#2A2FB8] hover:bg-[#1e238a] text-white px-4 py-2 sm:px-6 rounded-lg text-sm sm:text-base" onClick={toggleFollow} disabled={followLoading || !session?.user?.id}>{followLoading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}</Button>
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-6 md:p-8"> {/* Content Display Area */}
                  {document.featureImageUrl && (<div className="mb-6 sm:mb-8"><Image src={document.featureImageUrl} alt={document.title || "Feature Image"} width={800} height={400} className="rounded-lg object-cover w-full max-w-[800px] mx-auto shadow-md" priority={true} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /></div>)}
                  {isLoading ? (<div className="text-center py-10 text-gray-600">Loading document content...</div>) : 
                   error ? (<Alert variant="destructive" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>) : 
                   contentHtmlBody ? (
                    <div className="pdf-render-area">
                      <style>{layoutStyles}</style>
                      <style>{extractedHtmlStyles}</style>
                      <div className="pdf-content-host" dangerouslySetInnerHTML={{ __html: contentHtmlBody }} />
                    </div>
                  ) : (<Alert variant="default" className="mt-4"><AlertCircle className="h-4 w-4" /><AlertDescription>No content available.</AlertDescription></Alert>)}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}