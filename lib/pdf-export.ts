'use client'

import { jsPDF } from 'jspdf'

// Simple PDF export using the browser's print functionality with a custom print stylesheet
export async function exportPageToPDF(title: string, filename?: string) {
  // Wait a bit for any dynamic content to render
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Store original title
  const originalTitle = document.title
  
  // Set document title to the page-specific title for better PDF filename
  const pageTitle = getPageTitle()
  document.title = pageTitle
  
  // Create a print-specific stylesheet
  const printStyles = `
    @media print {
      @page { margin: 0; size: auto; }
      html, body { 
        margin: 0 !important; 
        padding: 0 !important; 
        width: 100% !important; 
        height: auto !important; 
        overflow: visible !important; 
        background: white !important; 
      }
      header, nav, aside, .sidebar, .fixed, [style*="position: fixed"], [style*="position:fixed"],
      button, .no-print, [data-no-print] { 
        display: none !important; 
      }
      main, [role="main"], .main-content, #main-content { 
        display: block !important; 
        width: 100% !important; 
        max-width: none !important; 
        margin: 0 !important; 
        padding: 20px !important; 
      }
      * { 
        box-shadow: none !important; 
        text-shadow: none !important; 
        filter: none !important; 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
      }
    }
  `
  
  // Add print styles
  const styleSheet = document.createElement('style')
  styleSheet.textContent = printStyles
  styleSheet.media = 'print'
  document.head.appendChild(styleSheet)
  
  // Trigger print dialog (user can choose "Save as PDF")
  window.print()
  
  // Restore original title and clean up
  setTimeout(() => {
    document.title = originalTitle
    document.head.removeChild(styleSheet)
  }, 1000)
}

export function getPageTitle(): string {
  // Try to get the page-specific h1 first
  const h1 = document.querySelector('main h1, [role="main"] h1, .main-content h1, #main-content h1')
  if (h1) return h1.textContent?.trim() || 'Documento'
  
  // Fallback: try breadcrumb or page header
  const breadcrumb = document.querySelector('[aria-label="breadcrumb"] li:last-child, .breadcrumb li:last-child, nav[aria-label="breadcrumb"] a:last-child')
  if (breadcrumb) return breadcrumb.textContent?.trim() || 'Documento'
  
  // Fallback: document title without site name
  const pageTitle = document.title
    .replace('DentCore', '')
    .replace('—', '')
    .replace('|', '')
    .replace('El sistema que impulsa tu laboratorio dental', '')
    .trim()
  
  return pageTitle || 'Documento'
}