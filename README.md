# PyDoc Studio

A static, browser-based tool that combines many Python source files into one PDF. It is designed for GitHub Pages and does not require a backend or Python installation.

## Features

- Bulk upload any file type (source code, documents, images, archives, compiled files, etc.)
- Drag-and-drop upload
- File list, filename search, preview, remove and reorder
- One combined PDF with a cover page and included-file list
- Large bold filename headings
- Monospaced text with indentation, blank lines and line order retained
- Binary files are represented as hexadecimal/ASCII dumps (first 2 MB per binary file)
- Each file starts on a new page; long files flow onto additional pages
- Optional line numbers
- Local browser processing: file contents are not sent to a server

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Keep an internet connection available so the jsPDF library can load from its CDN.
4. Upload any files and select **Generate PDF**.

For a local web server (optional), run this in the project folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish free with GitHub Pages

1. Sign in to GitHub and create a new **public** repository, for example `pydoc-studio`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository's root.
3. Open the repository's **Settings**.
4. Select **Pages** in the left sidebar.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Choose branch `main` and folder `/ (root)`, then click **Save**.
7. Wait a minute or two. GitHub will show your site address in the Pages section, usually:
   `https://YOUR-USERNAME.github.io/pydoc-studio/`

## Notes and limitations

- This is a client-side app. The files stay in the browser; the only external request is loading jsPDF from the CDN.
- PDF output uses jsPDF's built-in Courier font for code. This is ideal for ordinary Python source code and preserves whitespace and line order, but built-in PDF fonts do not cover every Unicode character. Unusual symbols or non-Latin text may not render correctly.
- Very long individual lines are wrapped to fit the printable page width. Their text order is retained, but visual line breaks in the PDF can differ from the source file.
- Each file starts on a new page after the cover/included-files page. A large collection can produce a large PDF.
- The browser must remain open until the download finishes.
- GitHub Pages hosts the app only. It does not store uploaded files or generated PDFs.


## Binary files

All file extensions are accepted. Text files are decoded as UTF-8. Binary files such as `.pyc`, `.exe`, `.png`, `.zip`, and `.pdf` are represented as hexadecimal/ASCII dumps because raw binary bytes are not ordinary readable text. Dumps are limited to the first 2 MB per binary file, with a truncation notice. This version does not decompile bytecode or extract text from images/PDFs.


## PDF engine loading troubleshooting

The app tries jsPDF from three CDN locations (cdnjs, jsDelivr, and unpkg). A working internet connection is required unless you add a local copy of `jspdf.umd.min.js` and reference it from `index.html`. If all CDNs are blocked by the network, browser, antivirus, or an extension, PDF generation cannot start. Try another network or allow these CDN scripts.


## V4 PDF layout fix

Code lines are now wrapped using jsPDF's measured Courier font width. The PDF renderer no longer applies a second automatic wrap, which could cause long TypeScript/JavaScript lines to overlap subsequent lines. Line numbers are placed in a separate gutter and continuation lines align with the code text.


## V5 interface refresh

The interface has been redesigned with a more polished dark workspace, refined typography, clearer import/organize/export sections, improved responsive layouts, updated upload visuals, and more legible file rows. Existing upload, preview, reorder, and PDF-generation behavior is retained.
