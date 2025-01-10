// controllers/certificate.controller.js
const Certificate = require('../models/certificate.model');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const qr = require('qr-image');

// CREATE a new certificate
exports.createCertificate = async (req, res) => {
    try {
        // If you want to automatically generate the learningId:
        const learningId = crypto.randomBytes(16).toString('hex');

        const certificate = new Certificate({
            candidateName: req.body.candidateName,
            courseName: req.body.courseName,
            learningId: learningId
        });

        await certificate.save();
        return res.status(201).json(certificate);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// GET certificate by learningId
exports.getCertificateByLearningId = async (req, res) => {
    try {
        const { learningId } = req.params;
        const certificate = await Certificate.findOne({ learningId: learningId });
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }
        return res.json(certificate);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// 1. GET ALL Certificates
exports.getAllCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.find();
        return res.json(certificates);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 2. UPDATE Certificate by ID
exports.updateCertificate = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedCert = await Certificate.findByIdAndUpdate(
            id,
            {
                candidateName: req.body.candidateName,
                courseName: req.body.courseName,
            },
            { new: true } // This returns the updated document
        );

        if (!updatedCert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        return res.json(updatedCert);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// 3. DELETE Certificate by ID
exports.deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCert = await Certificate.findByIdAndDelete(id);

        if (!deletedCert) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        return res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
exports.downloadCertificatePDF = async (req, res) => {
    try {
        const { learningId } = req.params;

        const certificate = await Certificate.findOne({ learningId });
        if (!certificate) {
            return res.status(404).json({ message: 'Certificate not found' });
        }

        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-disposition', `attachment; filename=${learningId}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);
        // ---------------------------------------------------------------------
        // ADD WATERMARK (Behind Content)
        // ---------------------------------------------------------------------
        const watermarkPath = path.join(__dirname, '../assets/logo.png');
        if (fs.existsSync(watermarkPath)) {
            doc.save();
            doc.opacity(0.1);  // Light watermark
            const imgWidth = 450;
            const imgHeight = 300;
            const x = (doc.page.width - imgWidth) / 2;
            const y = (doc.page.height - imgHeight) / 2;
            doc.image(watermarkPath, x, y, { width: imgWidth, height: imgHeight });
            doc.restore();
        }

        // ---------------------------------------------------------------------
        // Helper for centered single-line text
        function centerText(text, fontSize = 12, fontName = 'Helvetica', color = '#000000') {
            doc.fontSize(fontSize).font(fontName).fillColor(color);
            const textWidth = doc.widthOfString(text);
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const xCoord = doc.page.margins.left + (pageWidth - textWidth) / 2;
            doc.text(text, xCoord, doc.y, { lineBreak: false });
        }

        // ---------------------------------------------------------------------
        // 1) LOGO + "CLYVYSYS" SIDE BY SIDE, CENTERED
        // ---------------------------------------------------------------------
        const logoPath = path.join(__dirname, '../assets/logo.png');
        if (fs.existsSync(logoPath)) {
            const logoWidth = 60;
            const textPadding = 10;
            const yCoord = 60;

            // Draw Logo
            // doc.image(logoPath, doc.page.margins.left, yCoord, { width: logoWidth });

            // Prepare separate text segments
            const part1 = 'CLYVY';
            const part2 = 'SYS';

            // Define fonts, colors, and sizes for each text segment
            const fontSize = 18;
            const font = 'Helvetica-Bold';
            doc.font(font).fontSize(fontSize);

            // Measure widths of logo and first part of the text
            const part1Width = doc.widthOfString(part1);
            const part2Width = doc.widthOfString(part2);
            const totalTextWidth = part1Width + part2Width;
            const totalWidth = logoWidth + textPadding + totalTextWidth;

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

            // Calculate x-coordinate to center logo and text as a group
            const startX = doc.page.margins.left + (pageWidth - totalWidth) / 2;

            // Draw Logo at calculated position
            doc.image(logoPath, startX, yCoord, { width: logoWidth });

            // Positioning for text after the logo
            const textStartX = startX + logoWidth + textPadding;
            const textY = yCoord + logoWidth / 4;  // Adjust vertical alignment as needed

            // Draw first part of the text ("CLYVY")
            doc.fillColor('#333333').text(part1, textStartX, textY, { lineBreak: false });

            // Calculate position for the second part ("SYS") right after "CLYVY"
            const part2X = textStartX + part1Width;

            // Optionally, change styling for "SYS" differently
            // e.g., different color or font weight
            doc.fillColor('#ff5733'); // Change color for "SYS" if desired

            doc.text(part2, part2X, textY, { lineBreak: false });

            // Move doc.y below the logo area for subsequent content
            doc.y = yCoord + logoWidth + 30;
        } else {
            doc.moveDown(4);
        }

        // ---------------------------------------------------------------------
        // 2) CERTIFICATE OF ACCOMPLISHMENT (CENTER)
        // ---------------------------------------------------------------------
        centerText('Certificate of Accomplishment', 20, 'Helvetica-Bold', '#fe5732');
        doc.moveDown(2);

        // ---------------------------------------------------------------------
        // 3) DARK BANNER FOR COURSE NAME
        // ---------------------------------------------------------------------
        const courseName = certificate.courseName || 'NO COURSE PROVIDED';
        doc.fontSize(12).font('Helvetica-Bold');
        const courseTextWidth = doc.widthOfString(courseName) + 50;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const courseBoxX = doc.page.margins.left + (pageWidth - courseTextWidth) / 2;
        const courseBoxY = doc.y;

        doc.save().rect(courseBoxX, courseBoxY, courseTextWidth, 25).fill('#0056b6').restore();

        // Place the course name in white
        doc.fillColor('#ffffff');
        const textX = courseBoxX + 25;
        const textY = courseBoxY + 6;
        doc.text(courseName, textX, textY, { lineBreak: false });

        doc.y = courseBoxY + 25 + 20; // move below the banner

        // ---------------------------------------------------------------------
        // 4) PRESENTED TO (CENTER) + EXTRA SPACE + NAME
        // ---------------------------------------------------------------------
        centerText('PRESENTED TO', 10, 'Helvetica', '#555555');
        doc.moveDown(2);
        centerText(certificate.candidateName.toUpperCase(), 18, 'Helvetica-Bold', '#000000');
        doc.moveDown(2);

        // Thin divider
        const dividerY = doc.y;
        doc.moveTo(doc.page.margins.left, dividerY)
            .lineTo(doc.page.width - doc.page.margins.right, dividerY)
            .strokeColor('#888888')
            .stroke();
        doc.moveDown(1);

        // ---------------------------------------------------------------------
        // 5) BODY TEXT (CENTERED, MULTIPLE LINES)
        // ---------------------------------------------------------------------
        const line1 = 'The bearer of this certificate has successfully completed a specialized training course';
        const line2 = 'under the guidance of Clyvysys, showcasing exceptional dedication and skill.This ';
        const line3 = 'achievement stands as a testament to their comprehensive understanding of the ';
        const line4 = 'material of the materialand their commitment to continual growth. We commend their ';
        const line5 = 'accomplishments and wish them continued success in all future endeavors.';

        centerText(line1, 11, 'Helvetica-Bold', '#444444');
        doc.moveDown(1);
        centerText(line2, 11, 'Helvetica-Bold', '#444444');
        doc.moveDown(1);
        centerText(line3, 11, 'Helvetica-Bold', '#444444');
        doc.moveDown(1);
        centerText(line4, 11, 'Helvetica-Bold', '#444444');
        doc.moveDown(1);
        centerText(line5, 11, 'Helvetica-Bold', '#444444');
        doc.moveDown(12);

        // ---------------------------------------------------------------------
        // 6) LEFT BLOCK: Earned On, ID; RIGHT BLOCK: Signature + Name + Title
        // ---------------------------------------------------------------------
        const startY = doc.y; // remember this starting position
        const leftX = doc.page.margins.left;
        const rightBlockWidth = 200;
        const rightX = doc.page.width - doc.page.margins.right - rightBlockWidth;

        //
        // A) LEFT TEXT BLOCK
        //
        doc.fontSize(10).font('Helvetica').fillColor('#000000');

        const leftStartY = doc.y;
        const earnedDate = new Date(certificate.creationDate).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // "Earned on: " + bold date
        doc
            .fontSize(10)
            .fillColor('#000000')
            // normal text (continued: true)
            .font('Helvetica')
            .text('Earned on: ', leftX + 20, leftStartY, {
                width: 300,
                lineBreak: true,
                continued: true
            })
            // bold text (continued: false ends the line)
            .font('Helvetica-Bold')
            .text(earnedDate, {
                width: 300,
                lineBreak: true,
                continued: false
            });

        const afterEarnedY = doc.y + 5; // small spacing
        doc.text(`ID: ${certificate.learningId.toUpperCase()}`, leftX + 20, afterEarnedY, {
            width: 300,
            lineBreak: true
        });

        const leftBlockBottomY = doc.y;

        //
        // B) RIGHT BLOCK: Signature + Name + Title
        //
        let rightBlockTopY = startY;
        const signaturePath = path.join(__dirname, '../assets/signature.png');
        // Offsets for signature image
        const offsetX = 85;
        const offsetY = -80;

        if (fs.existsSync(signaturePath)) {
            doc.image(signaturePath, rightX + offsetX, rightBlockTopY + offsetY, {
                width: 100
            });
        }

        // Name
        doc.fontSize(10).font('Helvetica-Bold').text('Yaseen Feroz', rightX - 30, rightBlockTopY, {
            align: 'right',
            width: rightBlockWidth
        });
        // Title
        doc.fontSize(9).font('Helvetica').text('CTO, Clyvysys Pvt. Ltd.', rightX - 20, doc.y, {
            align: 'right',
            width: rightBlockWidth
        });

        const rightBlockBottomY = doc.y;

        // Move doc.y below whichever block is taller
        const maxBottom = Math.max(leftBlockBottomY, rightBlockBottomY);
        doc.y = maxBottom + 20;
        // ---------------------------------------------------------------------

        // ---------------------------------------------------------------------
        // 7) PRINT THE DYNAMIC CERTIFICATE URL AT THE BOTTOM
        // ---------------------------------------------------------------------
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        // e.g. http://localhost:5000 or https://yourdomain.com
        const pdfURL = `${baseUrl}/api/certificates/${learningId}/pdf`;

        // We'll define a bottomY coordinate, e.g. 20 points above the bottom
        // Position for bottom text
        const bottomY = doc.page.height - doc.page.margins.bottom - 20;

        // First part: "Certificate URL: " (black, not a link)
        doc.fontSize(10)
            .fillColor('#000000')
            .text('Certificate URL: ', doc.page.margins.left + 20, bottomY, {
                continued: true // stay on the same line
            });

        // Second part: the actual URL (blue, clickable, underlined)
        doc.fillColor('blue')
            .text(pdfURL, {
                link: pdfURL,
                underline: true,
                continued: false // end the line here
            });
        // 7) ADD QR CODE ABOVE CERTIFICATE URL
        // ---------------------------------------------------------------------
        // Generate a PNG QR code for "https://clyvysys.com"
        const qrPng = qr.imageSync('https://clyvysys.com', { type: 'png', margin: 1, size: 10 });

        // Determine position for the QR code:
        // For instance, 120 points above the bottomY coordinate
        const qrWidth = 100; // desired width of QR code in PDF
        const qrX = doc.page.margins.left + 20;   // adjust horizontal position if needed
        const qrY = bottomY - 120;                // position above the URL text

        // Embed the QR code image in the PDF
        doc.image(qrPng, qrX, qrY, { width: qrWidth });
        // ---------------------------------------------------------------------
        // ADD BORDER AROUND PAGE
        // ---------------------------------------------------------------------
        const { left: borderLeft, top: borderTop, right: borderRight, bottom: borderBottom } = doc.page.margins;
        const borderWidth = doc.page.width;
        const borderHeight = doc.page.height;

        doc.lineWidth(3)
            .strokeColor('#000000')
            .rect(
                borderLeft,
                borderTop,
                borderWidth - borderLeft - borderRight,
                borderHeight - borderTop - borderBottom
            )
            .stroke();

        // ---------------------------------------------------------------------
        // Done
        // ---------------------------------------------------------------------
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        return res.status(500).json({ message: error.message });
    }
};
