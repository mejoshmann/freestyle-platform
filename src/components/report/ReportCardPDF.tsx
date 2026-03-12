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

export function generateReportCardPDF(data: ReportCardData): string {
  const doc = new jsPDF()
  const { athlete, coachName, skillScores, notes, season, date } = data
  
  // Page width for centering
  const pageWidth = 210
  const margin = 15
  
  // Header - Freestyle Vancouver
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('FREESTYLE VANCOUVER', pageWidth / 2, 20, { align: 'center' })
  
  // Subheader - Athlete Progress Report
  doc.setFontSize(14)
  doc.text('ATHLETE PROGRESS REPORT', pageWidth / 2, 30, { align: 'center' })
  
  // Athlete Info at top
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('ATHLETE:', margin, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(athlete.full_name, margin + 25, 42)
  
  doc.setFont('helvetica', 'bold')
  doc.text('SEASON/YEAR:', 90, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(season, 125, 42)
  
  doc.setFont('helvetica', 'bold')
  doc.text('MOUNTAIN:', 160, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(athlete.mountain || 'N/A', 185, 42)
  
  doc.setFont('helvetica', 'bold')
  doc.text('COACH:', margin, 50)
  doc.setFont('helvetica', 'normal')
  doc.text(coachName, margin + 20, 50)
  
  // Legend text
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text("SKILL PROGRESSIONS: ", margin, 58)
  doc.setFont('helvetica', 'normal')
  doc.text('1-Area of Focus | 2-Partial | 3-Consistent | 4-Mastered', margin + 35, 58)
  
  // Starting Y position for skill evaluations
  let y = 65
  const lineHeight = 6
  
  // Group skill scores by category (extract category from skill_name if it contains colon)
  const groupedSkills: Record<string, SkillScore[]> = {}
  skillScores.forEach((score) => {
    const parts = score.skill_name.split(':')
    const category = parts.length > 1 ? parts[0].trim() : 'SKILLS'
    const skillName = parts.length > 1 ? parts[1].trim() : score.skill_name
    
    if (!groupedSkills[category]) {
      groupedSkills[category] = []
    }
    groupedSkills[category].push({ ...score, skill_name: skillName })
  })
  
  // Categories that should show Yes/No instead of 1-4 scores
  const yesNoCategories = ['Suggested Training', 'Programs for Next Season']
  
  // Draw each category with its skills - multiple per line
  Object.entries(groupedSkills).forEach(([category, skills]) => {
    // Check if this is a Yes/No category
    const isYesNoCategory = yesNoCategories.some(yn => category.toLowerCase().includes(yn.toLowerCase()))
    
    // Category name - bold, uppercase
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(category.toUpperCase(), margin, y)
    y += lineHeight + 2
    
    if (isYesNoCategory) {
      // Draw Yes/No skills - 3 per line
      let skillsInLine = 0
      let currentX = margin + 5
      
      skills.forEach((skill) => {
        // Check if we need to start a new line (3 skills per line)
        if (skillsInLine === 3) {
          y += lineHeight + 2
          skillsInLine = 0
          currentX = margin + 5
        }
        
        // Skill name
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(skill.skill_name, currentX, y)
        
        // Yes/No (score >= 3 means Yes, otherwise No)
        const scoreX = currentX + doc.getTextWidth(skill.skill_name) + 3
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        if (skill.score && skill.score >= 3) {
          doc.text('Y', scoreX, y)
        } else {
          doc.text('N', scoreX, y)
        }
        
        skillsInLine++
        currentX = margin + 5 + (skillsInLine * 65)
      })
      
      // Move to next line after last skill
      if (skillsInLine > 0) {
        y += lineHeight + 4
      }
    } else {
      // Draw regular skills - 3 per line with just the score number
      let skillsInLine = 0
      let currentX = margin + 5
      
      skills.forEach((skill) => {
        // Check if we need to start a new line (3 skills per line)
        if (skillsInLine === 3) {
          y += lineHeight + 2
          skillsInLine = 0
          currentX = margin + 5
        }
        
        // Skill name
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(skill.skill_name, currentX, y)
        
        // Score number (just the selected score, or '-' if none)
        const scoreX = currentX + doc.getTextWidth(skill.skill_name) + 3
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        if (skill.score && skill.score > 0) {
          doc.text(skill.score.toString(), scoreX, y)
        } else {
          doc.text('-', scoreX, y)
        }
        
        skillsInLine++
        // Move X for next skill (approx 60mm per skill column)
        currentX = margin + 5 + (skillsInLine * 65)
      })
      
      // Move to next line after last skill
      if (skillsInLine > 0) {
        y += lineHeight + 4
      }
    }
  })
  
  // If no skills evaluated, show message
  if (skillScores.length === 0) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('No skills evaluated yet.', margin, y)
    y += lineHeight
  }
  
  y += 4
  
  // Competed in competition checkbox
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPETED IN A COMPETITION:', margin, y)
  doc.rect(margin + 75, y - 4, 5, 5)
  doc.text('☐', margin + 75.5, y - 0.5)
  y += lineHeight + 6
  
  // WHAT IS NEXT section
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('WHAT IS NEXT?', margin, y)
  y += lineHeight
  doc.text('GOALS FOR', margin, y)
  y += lineHeight
  doc.text('NEXT SEASON/', margin, y)
  y += lineHeight
  doc.text('COMMENTS', margin, y)
  
  // Comments box
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const commentsX = margin + 35
  const commentsWidth = pageWidth - margin - commentsX - margin
  const comments = notes || ''
  const splitComments = doc.splitTextToSize(comments, commentsWidth)
  doc.text(splitComments, commentsX, y - 12)
  
  // Draw box around comments
  doc.rect(commentsX, y - 20, commentsWidth, 25)
  y += 20
  
  // SUGGESTED TRAINING section
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('SUGGESTED TRAINING', margin, y)
  y += lineHeight + 2
  
  // Spring and Summer Training
  doc.text('SPRING AND SUMMER TRAINING:', margin, y)
  y += lineHeight
  
  const trainingItems = ['Trampoline', 'Dryland', 'Water Ramps']
  let trainingX = margin + 10
  trainingItems.forEach((item) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(item, trainingX, y)
    doc.rect(trainingX + 22, y - 3, 4, 4)
    doc.text('☐', trainingX + 22.5, y - 0.5)
    trainingX += 45
  })
  y += lineHeight + 2
  
  // Fall Training
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('FALL TRAINING:', margin, y)
  y += lineHeight
  
  trainingX = margin + 10
  trainingItems.forEach((item) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(item, trainingX, y)
    doc.rect(trainingX + 22, y - 3, 4, 4)
    doc.text('☐', trainingX + 22.5, y - 0.5)
    trainingX += 45
  })
  y += lineHeight + 4
  
  // PROGRAMS FOR NEXT SEASON
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('PROGRAMS FOR NEXT SEASON:', margin, y)
  y += lineHeight
  
  const programs = [
    { name: 'FUNdamentalz', x: margin + 5 },
    { name: 'Freestylerz', x: margin + 45 },
    { name: 'Night Riders', x: margin + 80 },
    { name: 'Girlstylerz', x: margin + 120 },
    { name: 'DEV Team', x: margin + 5 },
  ]
  
  programs.forEach((prog, index) => {
    if (index === 4) {
      y += lineHeight + 2
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const displayName = prog.name === 'DEV Team' ? 'DEV Team (Invite Required)' : prog.name
    doc.text(displayName, prog.x, y)
    const boxX = index === 4 ? prog.x + 55 : prog.x + 30
    doc.rect(boxX, y - 3, 4, 4)
    doc.text('☐', boxX + 0.5, y - 0.5)
  })
  y += lineHeight + 6
  
  // Footer - Coach and Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('COACH NAME:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(coachName, margin + 30, y)
  
  doc.setFont('helvetica', 'bold')
  doc.text('DATE:', 110, y)
  doc.setFont('helvetica', 'normal')
  doc.text(date, 125, y)
  y += lineHeight + 4
  
  // Contact info at bottom
  doc.setFontSize(8)
  doc.text('For more information: info@vancouverfreestyle.com', margin, y)
  y += lineHeight
  doc.text('Congratulations!', margin, y)
  y += lineHeight
  doc.text('See you next season!', margin, y)
  
  // Return PDF as base64
  return doc.output('datauristring').split(',')[1]
}

export function downloadReportCardPDF(data: ReportCardData): void {
  // Generate the PDF and trigger download
  const base64 = generateReportCardPDF(data)
  const link = document.createElement('a')
  link.href = 'data:application/pdf;base64,' + base64
  link.download = `${data.athlete.full_name.replace(/\s+/g, '_')}_Progress_Report.pdf`
  link.click()
}

export default generateReportCardPDF
