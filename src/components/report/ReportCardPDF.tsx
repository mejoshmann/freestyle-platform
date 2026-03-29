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
  const thirdPage = pageHeight / 3
  const lineHeight = 5
  
  // ========== TOP THIRD (Header Section) ==========
  
  // Add pointy mountains in background (top third)
  try {
    const pointyBase64 = await loadPointyAsBase64()
    if (pointyBase64) {
      doc.addImage(pointyBase64, 'PNG', 0, thirdPage - 30, pageWidth, 50)
    }
  } catch (e) {
    console.log('Pointy mountains image not loaded')
  }
  
  // Add logo on top left
  const logoBase64 = await loadLogoAsBase64()
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, 8, 45, 45)
    } catch (e) {
      console.log('Logo failed to render:', e)
    }
  }
  
  // Right side - Congratulations message
  const rightX = pageWidth / 2 + 10
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('CONGRATULATIONS!', rightX, 25)
  
  // Freestyle Vancouver Athlete Progress Report
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  // Set red color for FREESTYLE
  doc.setTextColor(237, 65, 55)
  doc.text('FREESTYLE', rightX, 50)
  // Reset to black for VANCOUVER
  doc.setTextColor(0, 0, 0)
  const freestyleWidth = doc.getTextWidth('FREESTYLE')
  doc.text('VANCOUVER', rightX + freestyleWidth + 3, 50)
  doc.setFontSize(12)
  doc.text('Athlete Progress Report', rightX, 58)
  
  // Athlete, Coach, Season and Group Name (middle of top third)
  const topThirdMiddle = thirdPage / 2 + 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Athlete: ${athlete.full_name}`, margin, topThirdMiddle)
  doc.setFontSize(10)
  doc.text(`Coach: ${coachName}`, margin, topThirdMiddle + 8)
  doc.text(`Season: ${season}`, margin, topThirdMiddle + 16)
  doc.text(`Group Name: ${athlete.group_name || 'N/A'}`, margin, topThirdMiddle + 24)
  
  // ========== MIDDLE THIRD - SKILLS SECTION ==========
  
  const leftX = margin
  
  let currentY = thirdPage + 5
  
  // Add skier logo in middle section background - larger and centered
  try {
    const skierLogoBase64 = await loadSkierLogoAsBase64()
    if (skierLogoBase64) {
      const skierSize = 150
      const centerX = (pageWidth - skierSize) / 2
      const centerY = thirdPage + -40
      doc.addImage(skierLogoBase64, 'PNG', centerX, centerY, skierSize, skierSize)
    }
  } catch (e) {
    console.log('Skier logo image not loaded')
  }
  
  // Athlete's Skills and Progressions header - under the mountain/skier image
  currentY += 22
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text("Athlete's Skills and Progressions", leftX, currentY)
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
    } else if (score.skill_id.startsWith('effort-participation')) {
      category = 'Effort & Participation'
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
  
  // Define the 6 categories - displayed with Effort & Participation as two lines
  const categories = ['Effort & Participation', 'Moguls', 'Air Tricks', 'Jumping', 'Freeskiing', 'Terrain Park']
  const skillsStartY = currentY
  
  // Layout constants - reduced spacing
  const categoryRowHeight = 8
  const categoryGap = 2
  
  // Column positions
  const categoryColX = leftX
  const scoresColX = leftX + 55
  
  let currentRowY = skillsStartY
  
  // Draw each category with inline scores
  categories.forEach((category) => {
    const skills = groupedSkills[category] || []
    
    // Category name on the left
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    // Special display for Effort & Participation - show as two lines
    if (category === 'Effort & Participation') {
      doc.text('Effort &', categoryColX, currentRowY)
    } else {
      doc.text(`${category}:`, categoryColX, currentRowY)
    }
    
    // Scores inline on the right - with line wrapping for long categories
    if (skills.length === 0) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text('No skills evaluated', scoresColX, currentRowY)
    } else {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      // Spread skills across the line with tight spacing and wrap if needed
      let skillX = scoresColX
      let skillY = currentRowY
      const maxX = pageWidth - margin - 5
      
      skills.forEach((skill, index) => {
        const scoreText = skill.score ? skill.score.toString() : '-'
        const skillText = `${skill.skill_name}: ${scoreText}`
        const textWidth = skillText.length * 2.5
        
        // Check if this skill would go off the page
        if (skillX + textWidth > maxX && index > 0) {
          // Wrap to next line
          skillY += 5
          skillX = scoresColX
        }
        
        doc.text(skillText, skillX, skillY)
        // Move x position for next skill (approximate width + tight spacing)
        skillX += textWidth + 4
      })
      
      // Update currentRowY if we wrapped to multiple lines
      if (skillY > currentRowY) {
        currentRowY = skillY
      }
    }
    
    // For Effort & Participation, add Participation: line underneath with same score
    if (category === 'Effort & Participation') {
      currentRowY += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Participation:', categoryColX, currentRowY)
      // Show same skills/scores
      if (skills.length === 0) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.text('No skills evaluated', scoresColX, currentRowY)
      } else {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        let skillX = scoresColX
        skills.forEach((skill) => {
          const scoreText = skill.score ? skill.score.toString() : '-'
          const skillText = `${skill.skill_name}: ${scoreText}`
          doc.text(skillText, skillX, currentRowY)
          skillX += skillText.length * 2.5 + 4
        })
      }
    }
    
    currentRowY += categoryRowHeight + 2
  })
  
  // ========== BOTTOM THIRD - WHAT'S NEXT ==========
  
  // Center in bottom third: start at 2/3 + 1/6 = middle of bottom third
  // Increased gap from skills section (+35 instead of +25)
  let bottomY = thirdPage * 2 + 35
  
  // What's Next? header
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text("What's Next?", leftX, bottomY)
  bottomY += lineHeight + 2
  
  // Training and Programs inline (side by side)
  // Get selected training items (Yes/No - score of 1 means Yes/Recommended)
  const selectedTraining = skillScores.filter(s => 
    s.skill_id.startsWith('training-') && s.score === 1
  )
  
  // Get selected programs (Yes/No - score of 1 means Yes/Selected)
  const selectedPrograms = skillScores.filter(s => 
    s.skill_id.startsWith('program-') && s.score === 1
  )
  
  // Only show Training/Programs section if at least one is selected
  if (selectedTraining.length > 0 || selectedPrograms.length > 0) {
    // Training on the left
    if (selectedTraining.length > 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Training:', leftX, bottomY)
      
      let trainingX = leftX + 22
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      selectedTraining.forEach((skill) => {
        const displayName = skill.skill_name.replace(/^Suggested Training:\s*/i, '')
        doc.text(displayName, trainingX, bottomY)
        trainingX += displayName.length * 1.8 + 6
      })
    }
    
    // Programs on the right
    if (selectedPrograms.length > 0) {
      const programsColX = selectedTraining.length > 0 ? (pageWidth / 2) + 20 : leftX
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Programs:', programsColX, bottomY)
      
      let programsX = programsColX + 22
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      selectedPrograms.forEach((skill) => {
        const displayName = skill.skill_name.replace(/^Programs for Next Season:\s*/i, '')
        doc.text(displayName, programsX, bottomY)
        programsX += displayName.length * 1.8 + 6
      })
    }
    
    bottomY += lineHeight + 10
  }
  
  // Goals underneath Training and Programs
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Goals for next season', leftX, bottomY)
  bottomY += lineHeight + 1
  
  // Comments/goals text
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const comments = notes || ''
  const splitComments = doc.splitTextToSize(comments, pageWidth - margin * 2)
  doc.text(splitComments, leftX, bottomY)
  
  // "See you next season!" at bottom of page
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('See you next season!', pageWidth / 2, pageHeight - 15, { align: 'center' })
  
  // Return PDF as complete data URL
  return doc.output('datauristring')
}

async function loadSkierLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/skierlogo.png')
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

async function loadPointyAsBase64(): Promise<string | null> {
  try {
    const response = await fetch('/pointy.png')
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
