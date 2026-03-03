import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const BLUE   = [59, 130, 246]
const GREEN  = [16, 185, 129]
const GRAY   = [100, 116, 139]
const DARK   = [30, 41, 59]

function ageLabel(birthdate) {
  const birth = new Date(birthdate)
  const now   = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months} months`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m > 0 ? `${y}y ${m}mo` : `${y} year${y !== 1 ? 's' : ''}`
}

export function generateGrowthPDF(baby, logs, records = []) {
  const doc  = new jsPDF()
  const page = doc.internal.pageSize

  // ── HEADER ──
  doc.setFontSize(22)
  doc.setTextColor(...BLUE)
  doc.setFont('helvetica', 'bold')
  doc.text('caretica', 14, 20)

  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(`Baby Growth Report  ·  Generated ${new Date().toLocaleDateString('en-PH', { dateStyle: 'long' })}`, 14, 28)

  // Divider
  doc.setDrawColor(...BLUE)
  doc.setLineWidth(0.5)
  doc.line(14, 32, page.width - 14, 32)

  // ── BABY PROFILE ──
  doc.setFontSize(13)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(baby.name, 14, 42)

  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `DOB: ${baby.birthdate}  ·  Age: ${ageLabel(baby.birthdate)}  ·  Gender: ${baby.gender}  ·  Blood Type: ${baby.blood_type}`,
    14, 49
  )

  // ── GROWTH LOG TABLE ──
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text('Growth History', 14, 62)

  const weightLogs = logs.filter((l) => l.type === 'weight').sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at))
  const heightLogs = logs.filter((l) => l.type === 'height').sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at))

  const allLogs = [...logs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at))

  autoTable(doc, {
    startY: 66,
    head: [['Date', 'Type', 'Value']],
    body: allLogs.length
      ? allLogs.map((l) => [
          new Date(l.logged_at).toLocaleDateString('en-PH', { dateStyle: 'medium' }),
          l.type.charAt(0).toUpperCase() + l.type.slice(1),
          `${l.value} ${l.unit || (l.type === 'weight' ? 'kg' : 'cm')}`,
        ])
      : [['No growth data logged yet', '', '']],
    headStyles:  { fillColor: BLUE, textColor: 255, fontStyle: 'bold' },
    bodyStyles:  { textColor: DARK },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 } },
  })

  // ── LATEST STATS ──
  const latestW = weightLogs.at(-1)
  const latestH = heightLogs.at(-1)
  if (latestW || latestH) {
    const statsY = doc.lastAutoTable.finalY + 8
    doc.setFontSize(9)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    const stats = [
      latestW && `Latest weight: ${latestW.value} kg`,
      latestH && `Latest height: ${latestH.value} cm`,
    ].filter(Boolean).join('   ·   ')
    doc.text(stats, 14, statsY)
  }

  // ── MEDICAL RECORDS ──
  if (records.length > 0) {
    const recY = doc.lastAutoTable.finalY + 18
    doc.setFontSize(11)
    doc.setTextColor(...DARK)
    doc.setFont('helvetica', 'bold')
    doc.text('Medical Records', 14, recY)

    autoTable(doc, {
      startY: recY + 4,
      head: [['Date', 'Type', 'Vaccine', 'Weight', 'Height', 'Notes']],
      body: records.map((r) => [
        r.date || r.created_at?.slice(0, 10) || '—',
        r.record_type || '—',
        r.vaccine_name || '—',
        r.weight ? `${r.weight} kg` : '—',
        r.height ? `${r.height} cm` : '—',
        r.doctor_notes ? r.doctor_notes.slice(0, 60) + (r.doctor_notes.length > 60 ? '…' : '') : '—',
      ]),
      headStyles: { fillColor: GREEN, textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: DARK },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 5: { cellWidth: 55 } },
    })
  }

  // ── FOOTER on every page ──
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'This report is for personal tracking only and does not replace professional medical advice. Always consult your pediatrician.',
      14,
      page.height - 10
    )
    doc.text(`Page ${i} of ${totalPages}`, page.width - 14, page.height - 10, { align: 'right' })
  }

  const filename = `caretica-${baby.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
