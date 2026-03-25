import jsPDF from 'jspdf'
import type { Athlete } from '../../types'

interface SkillScore {
  skill_id: string
  skill_name: string
  score: number | null
}

interface ReportCardData {
  athlete: Athlete
  coachName: string
  skillScores: SkillScore[]
  notes: string
  season: string
  date: string
}

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png')
    if (!response.ok) {
      console.log('Logo fetch failed:', response.status)
      return null
    }
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.log('Failed to load logo:', e)
    return null
  }
}

export async function generateReportCardPDF(data: ReportCardData): Promise<string> {
  const doc = new jsPDF()
  const { athlete, coachName, skillScores, notes, season, date } = data
  
  // Page dimensions
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const quarterPage = pageHeight / 4
  const lineHeight = 5
  
  // ========== TOP QUARTER (Header Section) ==========
  
  // Add mountains in background (top quarter)
  try {
    const mountainsBase64 = await loadMountainsAsBase64()
    if (mountainsBase64) {
      doc.addImage(mountainsBase64, 'PNG', 0, quarterPage - 20, pageWidth, 40)
    }
  } catch (e) {
    console.log('Mountains image not loaded')
  }
  
  // Add skier in center background
  try {
    const skierBase64 = await loadSkierAsBase64()
    if (skierBase64) {
      const centerX = (pageWidth - 40) / 2
      const centerY = 5
      doc.addImage(skierBase64, 'PNG', centerX, centerY, 40, 40)
    }
  } catch (e) {
    console.log('Skier image not loaded')
  }
  
  // Add logo on top left
  const logoBase64 = await loadLogoAsBase64()
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 5, 25, 18)
    } catch (e) {
      console.log('Logo failed to render:', e)
    }
  }
  
  // Right side - Congratulations message
  const rightX = pageWidth / 2 + 10
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Congratulations!', rightX, 20)
  
  // Freestyle Vancouver Athlete Progress Report
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Freestyle Vancouver', rightX, 45)
  doc.text('Athlete Progress Report', rightX, 52)
  
  // Coach and Date (compact)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Coach: ${coachName}`, margin, 30)
  doc.text(`Date: ${date}`, margin, 37)
  
  // ========== MIDDLE HALF - SKILLS SECTION ==========
  
  const leftX = margin
  
  let currentY = quarterPage + 5
  
  // Athlete Name and Mountain
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`${athlete.full_name} - ${athlete.mountain || 'N/A'}`, leftX, currentY)
  currentY += lineHeight + 2
  
  // Athlete's Skill/Progressions header
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text("Athlete's Skill/Progressions:", leftX, currentY)
  currentY += lineHeight + 1
  
  // Legend
  doc.setFontSize(6)
  doc.setFont('helvetica', 'italic')
  doc.text('1-Focus | 2-Partial | 3-Consistent | 4-Mastered', leftX, currentY)
  currentY += lineHeight + 3
  
  // Group skill scores by category
  const groupedSkills: Record<string, SkillScore[]> = {}
  skillScores.forEach((score) => {
    let category = 'SKILLS'
    if (score.skill_id.startsWith('training-')) {
      category = 'Suggested Training'
    } else if (score.skill_id.startsWith('program-')) {
      category = 'Programs for Next Season'
    } else if (score.skill_id.startsWith('moguls-')) {
      category = 'Moguls'
    } else if (score.skill_id.startsWith('bigair-')) {
      category = 'Jumping'
    } else if (score.skill_id.startsWith('freeski-')) {
      category = 'Freeskiing'
    } else if (score.skill_id.startsWith('jump-')) {
      category = 'Air Tricks'
    } else if (score.skill_id.startsWith('park-')) {
      category = 'Terrain Park'
    }
    
    // Only include actual skills (not training/programs)
    if (!['Suggested Training', 'Programs for Next Season'].includes(category)) {
      if (!groupedSkills[category]) {
        groupedSkills[category] = []
      }
      groupedSkills[category].push(score)
    }
  })
  
  // Define the 5 categories and lay them out with headings
  const categories = ['Moguls', 'Air Tricks', 'Jumping', 'Freeskiing', 'Terrain Park']
  const skillsStartY = currentY
  const skillsEndY = quarterPage * 3 - 5
  const numCols = 4
  const colWidth = (pageWidth - margin * 2) / numCols
  
  // Layout constants
  const headerHeight = 8
  const skillHeight = 5
  
  // For each category, display heading and skills in columns
  // Use skillsStartY as starting point, not redeclaring currentY
  currentY = skillsStartY
  
  categories.forEach((category) => {
    const skills = groupedSkills[category] || []
    if (skills.length === 0) return
    
    // Check if we need to move to next set of columns (new row of categories)
    if (currentY + headerHeight + (skills.length * skillHeight / numCols) > skillsEndY) {
      currentY = skillsStartY // Reset to top for next set
    }
    
    // Category heading spans full width
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(category, leftX, currentY)
    currentY += headerHeight
    
    // Skills in 4 columns
    const skillsPerRow = numCols
    const totalRows = Math.ceil(skills.length / skillsPerRow)
    
    for (let row = 0; row < totalRows; row++) {
      const rowY = currentY + (row * skillHeight)
      if (rowY > skillsEndY) break
      
      for (let col = 0; col < numCols; col++) {
        const skillIdx = (row * numCols) + col
        if (skillIdx >= skills.length) break
        
        const colX = leftX + (col * colWidth)
        const skill = skills[skillIdx]
        
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        const scoreText = skill.score ? skill.score.toString() : '-'
        const skillText = `${skill.skill_name}: ${scoreText}`
        const displayText = skillText.length > 20 ? skillText.substring(0, 20) + '...' : skillText
        doc.text(displayText, colX, rowY)
      }
    }
    
    // Advance Y for next category
    currentY += (totalRows * skillHeight) + 5
  })
  
  // ========== BOTTOM QUARTER - WHAT'S NEXT ==========
  
  let bottomY = quarterPage * 3 + 8
  
  // What's Next? header
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text("What's Next?", leftX, bottomY)
  bottomY += lineHeight + 2
  
  // LEFT SIDE - Goals for next season
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Goals:', leftX, bottomY)
  bottomY += lineHeight + 1
  
  // Comments/goals box
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const comments = notes || ''
  const splitComments = doc.splitTextToSize(comments, 85)
  doc.text(splitComments, leftX, bottomY)
  
  // Draw box around comments
  const boxHeight = Math.max(20, splitComments.length * 3.5)
  doc.rect(leftX, bottomY - 3, 85, boxHeight)
  
  // RIGHT SIDE - Season, Training and Programs
  const rightColX = (pageWidth / 2) + 5
  let rightY = quarterPage * 3 + 8
  
  // Season/Year
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Season: ${season}`, rightColX, rightY)
  rightY += lineHeight + 4
  
  // Get selected training items
  const selectedTraining = skillScores.filter(s => 
    s.skill_id.startsWith('training-') && s.score && s.score >= 3
  )
  
  // Only show Suggested Training if there are selected items
  if (selectedTraining.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Training:', rightColX, rightY)
    rightY += lineHeight + 1
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    selectedTraining.forEach((skill) => {
      doc.text(`• ${skill.skill_name}`, rightColX + 5, rightY)
      rightY += lineHeight
    })
    rightY += lineHeight
  }
  
  // Get selected programs
  const selectedPrograms = skillScores.filter(s => 
    s.skill_id.startsWith('program-') && s.score && s.score >= 3
  )
  
  // Only show Programs if there are selected items
  if (selectedPrograms.length > 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Programs:', rightColX, rightY)
    rightY += lineHeight + 1
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    selectedPrograms.forEach((skill) => {
      doc.text(`• ${skill.skill_name}`, rightColX + 5, rightY)
      rightY += lineHeight
    })
  }
  
  // "See you next season!" at bottom of page
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('See you next season!', pageWidth / 2, pageHeight - 15, { align: 'center' })
  
  // Return PDF as complete data URL
  return doc.output('datauristring')
}

async function loadSkierAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/skier.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    return null
  }
}

async function loadMountainsAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/mountains.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    return null
  }
}

export async function downloadReportCardPDF(data: ReportCardData): Promise<void> {
  // Generate the PDF and trigger download
  const base64 = await generateReportCardPDF(data)
  const link = document.createElement('a')
  link.href = 'data:application/pdf;base64,' + base64
  link.download = `${data.athlete.full_name.replace(/\s+/g, '_')}_Progress_Report.pdf`
  link.click()
}

export default generateReportCardPDF
