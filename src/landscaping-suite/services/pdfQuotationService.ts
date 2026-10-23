import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LandscapingProject, QuotationLineItem } from '../types/landscaping';
import { calculateQuotationSummary, formatCurrency } from '../utils/calculations';

export interface PdfServiceOptions {
  companyName?: string;
  tagline?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  taxRegistrationNumber?: string;
  nurseryHub?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankUpiId?: string;
  customNotes?: string;
}

export const DEFAULT_COMPANY_DETAILS: PdfServiceOptions = {
  companyName: 'TerraFlow Landscaping & Contracting',
  tagline: 'Commercial & Luxury Residential Landscape Architecture · Project Quotation',
  companyAddress: 'Central Nursery & Design Hub, 14/B Green Meadows Highway, Bengaluru 560035',
  companyPhone: '+91 94441 55210 / +91 98401 23456',
  companyEmail: 'contracts@terraflow.in',
  companyWebsite: 'www.terraflow.in',
  taxRegistrationNumber: 'GSTIN: 29AAAAA0000A1Z5 · PAN: AABCT1234F',
  nurseryHub: 'TerraFlow Central Botanical Farm & Acclimatization Center',
  bankName: 'HDFC Bank Ltd. (Koramangala Branch)',
  bankAccountName: 'TerraFlow Landscape Architecture Ltd.',
  bankAccountNumber: '50200088921456',
  bankIfsc: 'HDFC0001234',
  bankUpiId: 'terraflow.contracts@hdfcbank',
};

/**
 * Service to generate professional, formatted PDF quotation documents
 * with rich company branding, executive cost breakdown matrices,
 * categorized BOQ tables, commercial terms, and signature seals.
 */
export class PdfQuotationService {
  /**
   * Helper to draw a crisp vector botanical logo emblem in jsPDF
   */
  private static drawBrandEmblem(doc: jsPDF, x: number, y: number, size: number = 16): void {
    // Outer rounded square container in dark forest emerald
    doc.setFillColor(15, 61, 35); // #0f3d23
    doc.roundedRect(x, y, size, size, 2.5, 2.5, 'F');

    // Inner gold/emerald border accent
    doc.setDrawColor(245, 158, 11); // Amber 500
    doc.setLineWidth(0.3);
    doc.roundedRect(x + 0.6, y + 0.6, size - 1.2, size - 1.2, 2, 2, 'D');

    // Vector leaf / plant motif
    const cx = x + size / 2;
    const cy = y + size / 2 + 1;

    // Stem
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.6);
    doc.line(cx, cy + 4, cx, cy - 2);

    // Main Leaf (emerald light)
    doc.setFillColor(52, 211, 153); // Emerald 400
    doc.circle(cx - 2, cy - 1.5, 2.2, 'F');
    doc.circle(cx + 2, cy - 0.5, 2.2, 'F');

    // Top sprout bud (gold)
    doc.setFillColor(251, 191, 36); // Amber 400
    doc.circle(cx, cy - 3.8, 1.4, 'F');
  }

  /**
   * Generates a jsPDF instance loaded with all project data, company branding,
   * cost breakdowns, itemized bill of quantities, payment terms, and signature endorsements.
   */
  public static createQuotationPdfDoc(
    project: LandscapingProject,
    userOptions?: PdfServiceOptions
  ): jsPDF {
    const options: PdfServiceOptions = {
      ...DEFAULT_COMPANY_DETAILS,
      ...(userOptions || {}),
    };

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const quote = project.step3Quotation;
    const client = project.step1Enquiry;
    const currency = project.currency || '₹';
    const summary = calculateQuotationSummary(quote.items, quote.taxPercent, quote.discountAmount);

    const emeraldDark: [number, number, number] = [6, 78, 59]; // #064e3b
    const emeraldPrimary: [number, number, number] = [4, 120, 87]; // #047857
    const emeraldSoft: [number, number, number] = [236, 253, 245]; // #ecfdf5
    const neutralDark: [number, number, number] = [30, 41, 59]; // Slate 800
    const neutralMuted: [number, number, number] = [100, 116, 139]; // Slate 500
    const neutralBorder: [number, number, number] = [226, 232, 240]; // Slate 200

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Helper to format currency numbers cleanly in the PDF
    const fmt = (num: number) => {
      return `${currency} ${Number(num || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    };

    // =========================================================================
    // 1. COMPANY BRANDING HEADER BANNER
    // =========================================================================
    const bannerHeight = 30;
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.rect(0, 0, pageWidth, bannerHeight, 'F');

    // Subtle decorative gold line along the bottom of the header
    doc.setFillColor(245, 158, 11); // Amber 500
    doc.rect(0, bannerHeight, pageWidth, 1.2, 'F');

    // Draw Vector Logo Emblem
    this.drawBrandEmblem(doc, margin, 6.5, 17);

    // Company Brand Name & Tagline
    const textStartX = margin + 21;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14.5);
    doc.text(options.companyName || 'TerraFlow Landscaping & Contracting', textStartX, 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(209, 250, 229); // Emerald 100
    doc.text(options.tagline || 'Commercial & Luxury Residential Landscape Architecture · Official Quotation', textStartX, 17.5);

    doc.setFontSize(6.8);
    doc.setTextColor(167, 243, 208); // Emerald 200
    const contactLine = `${options.companyAddress} | Tel: ${options.companyPhone}`;
    const taxLine = `${options.companyEmail} · ${options.companyWebsite} | ${options.taxRegistrationNumber}`;
    doc.text(contactLine.substring(0, 80), textStartX, 22);
    doc.text(taxLine.substring(0, 80), textStartX, 26);

    // Right Side: Quotation Reference & Document Title
    const rightMargin = pageWidth - margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('PROJECT QUOTATION', rightMargin, 12, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(251, 191, 36); // Amber 400
    doc.text(`Ref: ${quote.quotationNumber}`, rightMargin, 16.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(220, 252, 231);
    doc.text(`Date: ${quote.createdDate}  |  Valid: ${quote.validUntilDate}`, rightMargin, 21, { align: 'right' });

    // Status Pill
    const isApproved = quote.status === 'Approved';
    const statusLabel = isApproved ? '✓ APPROVED BY CLIENT' : `STATUS: ${quote.status.toUpperCase()}`;
    const statusBg: [number, number, number] = isApproved ? [16, 185, 129] : [59, 130, 246];
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(rightMargin - 42, 23, 42, 4.8, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(statusLabel, rightMargin - 21, 26.5, { align: 'center' });

    // =========================================================================
    // 2. CLIENT & PROJECT SITE SCOPE CARDS (Side-by-Side)
    // =========================================================================
    let currentY = 36;
    const cardWidth = (pageWidth - margin * 2 - 6) / 2;
    const cardHeight = 34;

    // Card 1: Client Information
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(neutralBorder[0], neutralBorder[1], neutralBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    // Card 1 Top Accent Bar
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.rect(margin, currentY, cardWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('CLIENT & BILLING INFORMATION', margin + 3.5, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.text(client.clientName || 'Valued Client', margin + 3.5, currentY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.text(`Client Type: ${client.clientType || 'Residential Villa'}`, margin + 3.5, currentY + 16.5);
    doc.text(`Phone: ${client.phone || 'N/A'}  ·  Email: ${client.email || 'N/A'}`, margin + 3.5, currentY + 21);
    const siteAddr = client.siteAddress || 'Property Site Address';
    doc.text(`Site: ${siteAddr.substring(0, 48)}`, margin + 3.5, currentY + 25.5);
    doc.text(`City: ${client.city || 'Bangalore'} ${client.pincode ? `(${client.pincode})` : ''}`, margin + 3.5, currentY + 30);

    // Card 2: Project Scope & Site Specifications
    const card2X = margin + cardWidth + 6;
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    // Card 2 Top Accent Bar
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.rect(card2X, currentY, cardWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('PROJECT PROFILE & SPECIFICATIONS', card2X + 3.5, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    const cleanTitle = project.title.length > 38 ? project.title.substring(0, 35) + '...' : project.title;
    doc.text(cleanTitle, card2X + 3.5, currentY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.text(`Project Code: ${project.code}  ·  Stage: ${project.currentStage}`, card2X + 3.5, currentY + 16.5);

    // Site measurements from Step 2
    const measurements = project.step2SiteVisit?.measurements;
    const lawnArea = measurements?.lawnAreaSqFt ? `${measurements.lawnAreaSqFt.toLocaleString()} sq ft lawn` : 'Surveyed plot';
    const bedArea = measurements?.plantingBedAreaSqFt ? `, ${measurements.plantingBedAreaSqFt.toLocaleString()} sq ft beds` : '';
    doc.text(`Dimensions: ${lawnArea}${bedArea}`, card2X + 3.5, currentY + 21);

    const soilCondition = measurements?.soilType || 'Red Loam Soil';
    const sunCondition = measurements?.sunlightExposure || 'Full Direct Sun';
    doc.text(`Soil & Sun: ${soilCondition.split(' ')[0]} · ${sunCondition.split(' ')[0]} Sun`, card2X + 3.5, currentY + 25.5);

    const supervisor = project.step4Planning?.supervisorName || 'Senior Landscape Architect';
    doc.text(`Assigned Lead: ${supervisor}`, card2X + 3.5, currentY + 30);

    currentY += cardHeight + 5;

    // =========================================================================
    // 3. EXECUTIVE COST BREAKDOWN MATRIX (Required by User Brief)
    // =========================================================================
    const materialItems = quote.items.filter(i => i.category === 'materials');
    const plantItems = quote.items.filter(i => i.category === 'plants');
    const potItems = quote.items.filter(i => i.category === 'pots');
    const labourItems = quote.items.filter(i => i.category === 'labour');
    const transportItems = quote.items.filter(i => i.category === 'transport');
    const miscItems = quote.items.filter(i => !['materials', 'plants', 'pots', 'labour', 'transport'].includes(i.category));

    const totalSub = summary.subtotal || 1;
    const floraTotal = summary.plantsTotal + summary.potsTotal;

    const breakdownData = [
      {
        cat: '1. Materials & Hardscape',
        desc: 'Red soil, river sand, gravel, edging pavers, irrigation hardware',
        amount: summary.materialsTotal,
        pct: Math.round((summary.materialsTotal / totalSub) * 100),
      },
      {
        cat: '2. Flora, Palms & Turf',
        desc: 'Specimen trees, acclimatized palms, shrubs, lawn sod & pots',
        amount: floraTotal,
        pct: Math.round((floraTotal / totalSub) * 100),
      },
      {
        cat: '3. Labour & Trades',
        desc: 'Grading, soil preparation, planting crew, masons, irrigation techs',
        amount: summary.labourTotal,
        pct: Math.round((summary.labourTotal / totalSub) * 100),
      },
      {
        cat: '4. Logistics & Equipment',
        desc: 'Tipper freight, nursery transport, mini-excavator site machinery',
        amount: summary.transportTotal,
        pct: Math.round((summary.transportTotal / totalSub) * 100),
      },
    ];

    if (miscItems.length > 0) {
      const miscTotal = miscItems.reduce((acc, it) => acc + (it.total || 0), 0);
      breakdownData.push({
        cat: '5. Ancillary & Other Works',
        desc: 'Specialized testing, permits, site utilities & accessories',
        amount: miscTotal,
        pct: Math.round((miscTotal / totalSub) * 100),
      });
    }

    // Render Cost Breakdown Summary Banner & Table
    autoTable(doc, {
      startY: currentY,
      head: [['Cost Allocation Category', 'Scope & Specifications Included', 'Amount', '% Share']],
      body: breakdownData.map(b => [
        b.cat,
        b.desc,
        fmt(b.amount),
        `${b.pct}%`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: emeraldPrimary,
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: neutralDark,
        lineColor: neutralBorder,
      },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: 'bold' },
        1: { cellWidth: 96 },
        2: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
    });

    currentY = (doc as any).lastAutoTable.finalY + 5;

    // =========================================================================
    // 4. DETAILED ITEMIZED BILL OF QUANTITIES (BOQ)
    // =========================================================================
    const tableBody: any[] = [];
    let itemNumber = 1;

    // 1. Materials Section
    if (materialItems.length > 0) {
      const catTotal = materialItems.reduce((s, it) => s + it.total, 0);
      tableBody.push([
        {
          content: `1. SOIL, SUB-BASE & HARDSCAPE MATERIALS (Subtotal: ${fmt(catTotal)})`,
          colSpan: 6,
          styles: { fontStyle: 'bold', fillColor: emeraldSoft, textColor: emeraldDark },
        },
      ]);
      materialItems.forEach(item => {
        tableBody.push([
          itemNumber++,
          `${item.name}\n${item.spec || ''}`.trim(),
          'Material',
          `${item.quantity} ${item.unit}`,
          fmt(item.unitPrice),
          fmt(item.total),
        ]);
      });
    }

    // 2. Plants & Turf Section
    if (plantItems.length > 0) {
      const catTotal = plantItems.reduce((s, it) => s + it.total, 0);
      tableBody.push([
        {
          content: `2. SPECIMEN TREES, PALMS, SHRUBS & LAWN TURF SOD (Subtotal: ${fmt(catTotal)})`,
          colSpan: 6,
          styles: { fontStyle: 'bold', fillColor: emeraldSoft, textColor: emeraldDark },
        },
      ]);
      plantItems.forEach(item => {
        tableBody.push([
          itemNumber++,
          `${item.name}\n${item.spec || ''}`.trim(),
          'Plant / Turf',
          `${item.quantity} ${item.unit}`,
          fmt(item.unitPrice),
          fmt(item.total),
        ]);
      });
    }

    // 3. Pots & Planters Section
    if (potItems.length > 0) {
      const catTotal = potItems.reduce((s, it) => s + it.total, 0);
      tableBody.push([
        {
          content: `3. DESIGNER PLANTERS, POTS & ARCHITECTURAL VESSELS (Subtotal: ${fmt(catTotal)})`,
          colSpan: 6,
          styles: { fontStyle: 'bold', fillColor: emeraldSoft, textColor: emeraldDark },
        },
      ]);
      potItems.forEach(item => {
        tableBody.push([
          itemNumber++,
          `${item.name}\n${item.spec || ''}`.trim(),
          'Planter',
          `${item.quantity} ${item.unit}`,
          fmt(item.unitPrice),
          fmt(item.total),
        ]);
      });
    }

    // 4. Labor & Trades Section
    if (labourItems.length > 0) {
      const catTotal = labourItems.reduce((s, it) => s + it.total, 0);
      tableBody.push([
        {
          content: `4. ESTIMATED LABOUR HOURS, SPECIALIST TRADES & SITE CREWS (Subtotal: ${fmt(catTotal)})`,
          colSpan: 6,
          styles: { fontStyle: 'bold', fillColor: emeraldSoft, textColor: emeraldDark },
        },
      ]);
      labourItems.forEach(item => {
        tableBody.push([
          itemNumber++,
          `${item.name}\n${item.spec || 'Skilled landscaping & masonry artisans'}`.trim(),
          'Labour / Trade',
          `${item.quantity} ${item.unit}`,
          fmt(item.unitPrice),
          fmt(item.total),
        ]);
      });
    }

    // 5. Transport & Logistics
    if (transportItems.length > 0) {
      const catTotal = transportItems.reduce((s, it) => s + it.total, 0);
      tableBody.push([
        {
          content: `5. TRANSPORT FREIGHT, TIPPER TRUCKS & SITE MACHINERY (Subtotal: ${fmt(catTotal)})`,
          colSpan: 6,
          styles: { fontStyle: 'bold', fillColor: emeraldSoft, textColor: emeraldDark },
        },
      ]);
      transportItems.forEach(item => {
        tableBody.push([
          itemNumber++,
          `${item.name}\n${item.spec || ''}`.trim(),
          'Logistics',
          `${item.quantity} ${item.unit}`,
          fmt(item.unitPrice),
          fmt(item.total),
        ]);
      });
    }

    // 6. Miscellaneous & Other items
    if (miscItems.length > 0) {
      const catTotal = miscItems.reduce((s, it) => s + it.total, 0);
      tableBody.push([
        {
          content: `6. ANCILLARY SERVICES & MISCELLANEOUS WORKS (Subtotal: ${fmt(catTotal)})`,
          colSpan: 6,
          styles: { fontStyle: 'bold', fillColor: emeraldSoft, textColor: emeraldDark },
        },
      ]);
      miscItems.forEach(item => {
        tableBody.push([
          itemNumber++,
          `${item.name}\n${item.spec || ''}`.trim(),
          'Ancillary',
          `${item.quantity} ${item.unit}`,
          fmt(item.unitPrice),
          fmt(item.total),
        ]);
      });
    }

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Item Description & Technical Specifications', 'Category', 'Quantity', 'Rate', 'Total Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: emeraldDark,
        textColor: [255, 255, 255],
        fontSize: 7.8,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 2,
        textColor: neutralDark,
        lineColor: neutralBorder,
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 83 },
        2: { cellWidth: 24, fontStyle: 'italic', textColor: neutralMuted },
        3: { cellWidth: 20, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
      pageBreak: 'auto',
    });

    let finalY = (doc as any).lastAutoTable.finalY + 6;

    // Check if remaining page height is sufficient for totals & terms (needs ~75mm)
    if (finalY > 215) {
      doc.addPage();
      finalY = 18;
    }

    // =========================================================================
    // 5. TOTALS & FINANCIAL SUMMARY BOX (Right Side)
    // =========================================================================
    const summaryWidth = 88;
    const summaryX = pageWidth - margin - summaryWidth;
    const summaryBoxHeight = 58;

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(neutralBorder[0], neutralBorder[1], neutralBorder[2]);
    doc.roundedRect(summaryX, finalY, summaryWidth, summaryBoxHeight, 2, 2, 'FD');

    // Accent line
    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.rect(summaryX, finalY, summaryWidth, 1.2, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);

    let sumY = finalY + 5.5;
    const addSumRow = (label: string, value: string, isBold: boolean = false, isAccent: boolean = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(
        isAccent ? emeraldDark[0] : neutralDark[0],
        isAccent ? emeraldDark[1] : neutralDark[1],
        isAccent ? emeraldDark[2] : neutralDark[2]
      );
      doc.text(label, summaryX + 4, sumY);
      doc.text(value, summaryX + summaryWidth - 4, sumY, { align: 'right' });
      sumY += 5;
    };

    addSumRow('Materials & Hardscape Subtotal:', fmt(summary.materialsTotal));
    addSumRow('Plants, Turf & Nursery Stock:', fmt(summary.plantsTotal + summary.potsTotal));
    addSumRow('Estimated Labour & Artisan Trades:', fmt(summary.labourTotal));
    addSumRow('Freight, Logistics & Machinery:', fmt(summary.transportTotal));
    addSumRow('Gross Direct Cost Subtotal:', fmt(summary.subtotal), true);

    if (summary.discountAmount > 0) {
      addSumRow('Goodwill Discount Applied:', `-${fmt(summary.discountAmount)}`, true, true);
    }

    addSumRow(`Tax / GST (${quote.taxPercent}%):`, `+${fmt(summary.taxAmount)}`);

    // Grand Total Highlight Banner
    doc.setFillColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.roundedRect(summaryX + 2, sumY - 1.5, summaryWidth - 4, 11, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL CONTRACT VALUE:', summaryX + 5, sumY + 5.5);
    doc.text(fmt(summary.totalQuotation), summaryX + summaryWidth - 5, sumY + 5.5, { align: 'right' });

    // =========================================================================
    // 6. PAYMENT MILESTONES & BANK TRANSFER WIRE DETAILS (Left Side)
    // =========================================================================
    const termsWidth = summaryX - margin - 5;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(neutralBorder[0], neutralBorder[1], neutralBorder[2]);
    doc.roundedRect(margin, finalY, termsWidth, summaryBoxHeight, 2, 2, 'FD');

    doc.setFillColor(emeraldPrimary[0], emeraldPrimary[1], emeraldPrimary[2]);
    doc.rect(margin, finalY, termsWidth, 1.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('PAYMENT MILESTONES & DISBURSEMENT', margin + 4, finalY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    let termY = finalY + 10.5;

    const milestones = [
      `• 50% Mobilization Advance: ${fmt(summary.totalQuotation * 0.5)} (Due on sign-off & nursery booking)`,
      `• 40% Running Progress: ${fmt(summary.totalQuotation * 0.4)} (Due upon grading, civil & sod laying)`,
      `• 10% Handover Settlement: ${fmt(summary.totalQuotation * 0.1)} (Due upon punch-list inspection)`,
    ];
    milestones.forEach(m => {
      doc.text(m, margin + 4, termY);
      termY += 4.5;
    });

    // Bank Account Wire Box inside Left Column
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(167, 243, 208); // Emerald 200
    doc.roundedRect(margin + 3, termY + 1, termsWidth - 6, 21, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('BANK WIRE TRANSFER DETAILS', margin + 6, termY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.text(`Bank: ${options.bankName}`, margin + 6, termY + 9.5);
    doc.text(`Beneficiary: ${options.bankAccountName}`, margin + 6, termY + 13.5);
    doc.text(`Account No: ${options.bankAccountNumber}  |  IFSC: ${options.bankIfsc}`, margin + 6, termY + 17.5);
    if (options.bankUpiId) {
      doc.text(`UPI VPA: ${options.bankUpiId}`, margin + 6, termY + 20.5);
    }

    finalY += summaryBoxHeight + 6;

    // Check page space for Terms & Signatures (needs ~45mm)
    if (finalY > 240) {
      doc.addPage();
      finalY = 20;
    }

    // =========================================================================
    // 7. SCOPE WARRANTIES & COMMERCIAL TERMS
    // =========================================================================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('COMMERCIAL TERMS, WARRANTIES & CLIENT RESPONSIBILITIES', margin, finalY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    let legY = finalY + 7.5;
    const legalClauses = [
      '1. Warranty: 30-day replacement warranty on lawn turf sod survival; 90-day leak warranty on automated drip fittings.',
      '2. Validity: Quoted unit rates locked for 30 calendar days from issue date. Variations beyond agreed scope billed separately.',
      '3. Site Utilities: Client provides uninterrupted water source (minimum 1.5 bar) and 230V electricity at site boundary.',
      '4. Quality Guarantee: All nursery stock cultivated at TerraFlow Acclimatization Center and inspected for pest-free vitality.',
    ];
    legalClauses.forEach(cl => {
      doc.text(cl, margin, legY);
      legY += 3.8;
    });

    finalY = legY + 4;

    // =========================================================================
    // 8. DUAL SIGNATURES & AUTHORIZATION SEALS
    // =========================================================================
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineDashPattern([1.5, 1.5], 0);

    // Left Signature: Client Acceptance
    const sigColWidth = 72;
    doc.line(margin, finalY + 12, margin + sigColWidth, finalY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.text('CLIENT ACCEPTANCE & SIGN-OFF', margin, finalY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.text(`Authorized: ${quote.approvedByName || client.clientName || 'Client Name'}`, margin, finalY + 20);
    doc.text(`Date & Stamp: ${quote.approvedDate || '____________________'}`, margin, finalY + 23.5);

    // Right Signature: Authorized TerraFlow Signatory
    const rightSigX = pageWidth - margin - sigColWidth;
    doc.line(rightSigX, finalY + 12, pageWidth - margin, finalY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(neutralDark[0], neutralDark[1], neutralDark[2]);
    doc.text('FOR TERRAFLOW LANDSCAPING', rightSigX, finalY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.text('Authorized Project Manager / Principal Architect', rightSigX, finalY + 20);
    doc.text(`Seal & Date: ${quote.createdDate}`, rightSigX, finalY + 23.5);

    // Draw Official Stamp Badge Box
    doc.setDrawColor(16, 185, 129);
    doc.setLineDashPattern([], 0);
    doc.roundedRect(rightSigX + 44, finalY + 2, 28, 14, 1.5, 1.5, 'D');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(emeraldDark[0], emeraldDark[1], emeraldDark[2]);
    doc.text('OFFICIAL SEAL', rightSigX + 58, finalY + 7, { align: 'center' });
    doc.setFontSize(5);
    doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);
    doc.text('TERRAFLOW LTD', rightSigX + 58, finalY + 10.5, { align: 'center' });
    doc.text('BANGALORE HUB', rightSigX + 58, finalY + 13.5, { align: 'center' });

    // =========================================================================
    // 9. RUNNING FOOTER ON ALL PAGES
    // =========================================================================
    const pageCount = doc.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(neutralMuted[0], neutralMuted[1], neutralMuted[2]);

      // Thin separation rule
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, doc.internal.pageSize.getHeight() - 8, pageWidth - margin, doc.internal.pageSize.getHeight() - 8);

      doc.text(
        `TerraFlow Landscaping Suite · Ref: ${quote.quotationNumber} · Project: ${project.title} (${project.code}) · Confidential`,
        margin,
        doc.internal.pageSize.getHeight() - 4.5
      );
      doc.text(
        `Page ${p} of ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.getHeight() - 4.5,
        { align: 'right' }
      );
    }

    return doc;
  }

  /**
   * Generates and downloads the formatted PDF directly to the user's computer.
   */
  public static async downloadQuotationPdf(
    project: LandscapingProject,
    options?: PdfServiceOptions,
    fileName?: string
  ): Promise<void> {
    const doc = this.createQuotationPdfDoc(project, options);
    const safeName = (
      fileName ||
      `Quotation_${project.code}_${project.step3Quotation.quotationNumber}.pdf`
    ).replace(/[^a-zA-Z0-9._-]/g, '_');
    doc.save(safeName);
  }

  /**
   * Returns a blob URL of the generated PDF document (for iframes, previews, or sharing).
   */
  public static async getQuotationPdfBlobUrl(
    project: LandscapingProject,
    options?: PdfServiceOptions
  ): Promise<string> {
    const doc = this.createQuotationPdfDoc(project, options);
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  }

  /**
   * Returns standard clean printable HTML representation for native browser print dialogue.
   */
  public static printQuotationDirect(
    project: LandscapingProject,
    userOptions?: PdfServiceOptions
  ): void {
    const options: PdfServiceOptions = {
      ...DEFAULT_COMPANY_DETAILS,
      ...(userOptions || {}),
    };
    const quote = project.step3Quotation;
    const client = project.step1Enquiry;
    const summary = calculateQuotationSummary(quote.items, quote.taxPercent, quote.discountAmount);
    const currency = project.currency || '₹';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${quote.quotationNumber} - ${project.title} - Quotation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 24px; color: #1e293b; font-size: 11px; line-height: 1.45; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #047857; padding-bottom: 14px; margin-bottom: 16px; }
            .brand { font-size: 18px; font-weight: bold; color: #064e3b; }
            .tagline { font-size: 10px; color: #047857; margin-top: 2px; }
            .contact-meta { font-size: 9.5px; color: #64748b; margin-top: 4px; }
            .doc-title { font-size: 16px; font-weight: bold; color: #064e3b; text-align: right; }
            .doc-ref { font-size: 11px; font-weight: bold; color: #b45309; text-align: right; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
            .meta-title { font-size: 9px; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 4px; }
            .cost-matrix { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10px; }
            .cost-matrix th { background: #047857; color: #fff; padding: 6px 8px; text-align: left; }
            .cost-matrix td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
            table.boq-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 10px; }
            table.boq-table th { background: #064e3b; color: #fff; padding: 6px 8px; text-align: left; }
            table.boq-table td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
            .section-head { background: #ecfdf5; font-weight: bold; color: #064e3b; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-container { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
            .terms-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 9.5px; }
            .totals-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
            .total-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
            .grand-total { border-top: 2px solid #047857; padding-top: 6px; font-size: 13px; font-weight: bold; color: #064e3b; margin-top: 4px; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 28px; border-top: 1px dashed #cbd5e1; padding-top: 16px; }
            .sig-line { border-bottom: 1px solid #475569; height: 35px; margin-bottom: 4px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">${options.companyName}</div>
              <div class="tagline">${options.tagline}</div>
              <div class="contact-meta">${options.companyAddress} · Tel: ${options.companyPhone}</div>
              <div class="contact-meta">${options.companyEmail} · ${options.taxRegistrationNumber}</div>
            </div>
            <div>
              <div class="doc-title">OFFICIAL QUOTATION</div>
              <div class="doc-ref">Ref: ${quote.quotationNumber}</div>
              <div style="font-size: 9.5px; color: #64748b; text-align: right;">Date: ${quote.createdDate} | Valid: ${quote.validUntilDate}</div>
              <div style="font-size: 9.5px; font-weight: bold; color: #047857; text-align: right; margin-top: 3px;">Status: ${quote.status}</div>
            </div>
          </div>

          <div class="meta-grid">
            <div>
              <div class="meta-title">Client Information</div>
              <div style="font-weight: bold; font-size: 12px;">${client.clientName}</div>
              <div>${client.clientType} · ${client.phone} · ${client.email}</div>
              <div>Site: ${client.siteAddress || 'Project Site'}, ${client.city || ''}</div>
            </div>
            <div>
              <div class="meta-title">Project & Site Details</div>
              <div style="font-weight: bold; font-size: 12px;">${project.title} (${project.code})</div>
              <div>Lead Supervisor: ${project.step4Planning.supervisorName || 'Senior Landscape Architect'}</div>
              <div>Soil: ${project.step2SiteVisit?.measurements?.soilType || 'Red Loam Soil'} · Sunlight: ${project.step2SiteVisit?.measurements?.sunlightExposure || 'Full Sun'}</div>
            </div>
          </div>

          <div class="meta-title" style="margin-bottom: 6px;">Executive Cost Allocation Breakdown</div>
          <table class="cost-matrix">
            <thead>
              <tr>
                <th>Cost Category</th>
                <th>Included Scope</th>
                <th class="text-right">Amount (${currency})</th>
                <th class="text-center">% Share</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Materials & Hardscape</strong></td>
                <td>Soil, sand, sub-base, gravel, edging pavers, irrigation hardware</td>
                <td class="text-right">${formatCurrency(summary.materialsTotal, currency)}</td>
                <td class="text-center">${Math.round((summary.materialsTotal / summary.subtotal) * 100)}%</td>
              </tr>
              <tr>
                <td><strong>2. Flora, Palms & Turf</strong></td>
                <td>Specimen trees, ornamental palms, shrubs, lawn sod & pots</td>
                <td class="text-right">${formatCurrency(summary.plantsTotal + summary.potsTotal, currency)}</td>
                <td class="text-center">${Math.round(((summary.plantsTotal + summary.potsTotal) / summary.subtotal) * 100)}%</td>
              </tr>
              <tr>
                <td><strong>3. Labour & Trades</strong></td>
                <td>Grading, soil mixing, sod installation, masonry, drip technicians</td>
                <td class="text-right">${formatCurrency(summary.labourTotal, currency)}</td>
                <td class="text-center">${Math.round((summary.labourTotal / summary.subtotal) * 100)}%</td>
              </tr>
              <tr>
                <td><strong>4. Freight & Logistics</strong></td>
                <td>Tipper transport, nursery transit, equipment & machinery</td>
                <td class="text-right">${formatCurrency(summary.transportTotal, currency)}</td>
                <td class="text-center">${Math.round((summary.transportTotal / summary.subtotal) * 100)}%</td>
              </tr>
            </tbody>
          </table>

          <div class="meta-title" style="margin-bottom: 6px;">Itemized Bill of Quantities (BOQ)</div>
          <table class="boq-table">
            <thead>
              <tr>
                <th style="width: 22px;">#</th>
                <th>Item Description & Technical Specifications</th>
                <th>Category</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Rate (${currency})</th>
                <th class="text-right">Amount (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td><strong>${item.name}</strong><br/><span style="color: #64748b; font-size: 9px;">${item.spec || ''}</span></td>
                  <td style="text-transform: capitalize; color: #475569;">${item.category}</td>
                  <td class="text-right">${item.quantity} ${item.unit}</td>
                  <td class="text-right">${formatCurrency(item.unitPrice, currency)}</td>
                  <td class="text-right font-bold"><strong>${formatCurrency(item.total, currency)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-container">
            <div class="terms-box">
              <strong style="color: #064e3b; display: block; margin-bottom: 4px;">PAYMENT MILESTONES & WIRE DETAILS:</strong>
              <div>• 50% Mobilization Advance: ${formatCurrency(summary.totalQuotation * 0.5, currency)}</div>
              <div>• 40% Running Progress: ${formatCurrency(summary.totalQuotation * 0.4, currency)}</div>
              <div>• 10% Handover Settlement: ${formatCurrency(summary.totalQuotation * 0.1, currency)}</div>
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                <strong>Bank Wire:</strong> ${options.bankName}<br/>
                <strong>A/C:</strong> ${options.bankAccountNumber} | <strong>IFSC:</strong> ${options.bankIfsc}<br/>
                <strong>Beneficiary:</strong> ${options.bankAccountName}
              </div>
            </div>

            <div class="totals-box">
              <div class="total-row"><span>Materials & Soil Subtotal:</span> <span>${formatCurrency(summary.materialsTotal, currency)}</span></div>
              <div class="total-row"><span>Plants, Trees & Turf:</span> <span>${formatCurrency(summary.plantsTotal + summary.potsTotal, currency)}</span></div>
              <div class="total-row"><span>Labor Hours & Trades:</span> <span>${formatCurrency(summary.labourTotal, currency)}</span></div>
              <div class="total-row"><span>Freight & Transport:</span> <span>${formatCurrency(summary.transportTotal, currency)}</span></div>
              <div class="total-row" style="font-weight: bold;"><span>Gross Subtotal:</span> <span>${formatCurrency(summary.subtotal, currency)}</span></div>
              ${summary.discountAmount > 0 ? `<div class="total-row" style="color: #047857;"><span>Goodwill Discount:</span> <span>-${formatCurrency(summary.discountAmount, currency)}</span></div>` : ''}
              <div class="total-row"><span>Tax / GST (${quote.taxPercent}%):</span> <span>+${formatCurrency(summary.taxAmount, currency)}</span></div>
              <div class="total-row grand-total"><span>Total Quotation:</span> <span>${formatCurrency(summary.totalQuotation, currency)}</span></div>
            </div>
          </div>

          <div class="signatures">
            <div>
              <div class="sig-line"></div>
              <strong>CLIENT ACCEPTANCE & APPROVAL</strong>
              <div style="font-size: 9.5px; color: #64748b;">${quote.approvedByName || client.clientName || 'Client Signatory'}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <strong>FOR ${(options.companyName || 'TerraFlow Landscaping').toUpperCase()}</strong>
              <div style="font-size: 9.5px; color: #64748b;">Authorized Project Manager / Principal Architect</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}
