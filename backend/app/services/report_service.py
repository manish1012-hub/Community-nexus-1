import io
import csv
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class ReportService:
    @staticmethod
    def generate_adr_csv(reports_data: list) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Report Number", "Patient MRN", "Patient Name", "Suspected Medication",
            "Reaction Category", "Reaction Description", "Severity", "Onset Date",
            "Outcome", "Status", "Reported At"
        ])
        for r in reports_data:
            writer.writerow([
                r.get("report_number"),
                r.get("patient_mrn"),
                r.get("patient_name"),
                r.get("suspected_medication_name"),
                r.get("reaction_category"),
                r.get("reaction_description"),
                r.get("severity"),
                r.get("onset_date"),
                r.get("outcome"),
                r.get("status"),
                r.get("created_at")
            ])
        return output.getvalue()

    @staticmethod
    def generate_medications_csv(meds_data: list) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Code", "Generic Name", "Brand Name", "Therapeutic Class",
            "Dosage Form", "Standard Dosage", "Active Status"
        ])
        for m in meds_data:
            writer.writerow([
                m.get("code"),
                m.get("generic_name"),
                m.get("brand_name"),
                m.get("therapeutic_class"),
                m.get("dosage_form"),
                m.get("standard_dosage"),
                "Active" if m.get("is_active") else "Inactive"
            ])
        return output.getvalue()

    @staticmethod
    def generate_adr_pdf(reports_data: list) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=10
        )
        subtitle_style = ParagraphStyle(
            'SubTitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=15
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#b91c1c'),
            spaceAfter=12
        )

        elements = []
        elements.append(Paragraph("PharmaCare AI — Clinical Pharmacovigilance Report", title_style))
        elements.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Confidential Healthcare Surveillance Record", subtitle_style))
        elements.append(Paragraph("WARNING: Academic & Clinical Surveillance Prototype. This report presents observational safety signals for certified healthcare practitioner review. Do not discontinue or adjust medication without licensed medical guidance.", disclaimer_style))
        elements.append(Spacer(1, 10))

        # Table data
        headers = ["Report ID", "Patient MRN", "Medication", "Reaction", "Severity", "Status"]
        table_data = [headers]

        for r in reports_data[:40]: # First 40 for PDF summary
            table_data.append([
                str(r.get("report_number", "")),
                str(r.get("patient_mrn", "")),
                str(r.get("suspected_medication_name", ""))[:18],
                str(r.get("reaction_category", ""))[:16],
                str(r.get("severity", "")).capitalize(),
                str(r.get("status", "")).replace("_", " ").title()
            ])

        t = Table(table_data, colWidths=[80, 80, 110, 110, 75, 85])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')])
        ]))

        elements.append(t)
        doc.build(elements)
        return buffer.getvalue()

report_service = ReportService()
