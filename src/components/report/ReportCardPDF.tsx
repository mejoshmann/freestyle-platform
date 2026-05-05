import jsPDF from "jspdf";
import type { Athlete } from "../../types";
import { registerMontserrat } from "../../lib/registerFonts";
import { fundamentalzTemplates, freestylerzTemplates } from "../../data/defaultTemplates";

interface SkillScore {
  skill_id: string;
  skill_name: string;
  score: number | string | null;
}

interface ReportCardData {
  athlete: Athlete;
  coachName: string;
  skillScores: SkillScore[];
  notes: string;
  season: string;
  date: string;
  groupName?: string;
  programType?: string;
}

async function compressImage(
  url: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.7,
  fillWhite: boolean = false,
  opacity: number = 1.0,
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Image fetch failed: ${url} (${response.status})`);
      return null;
    }
    const blob = await response.blob();
    console.log(`Image fetched: ${url} (${blob.size} bytes, ${blob.type})`);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Scale down if needed
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        // Fill with white background if needed (for PNG transparency)
        if (fillWhite) {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        // Apply opacity if less than 1
        if (opacity < 1.0) {
          ctx.globalAlpha = opacity;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const result = canvas.toDataURL("image/jpeg", quality);
        URL.revokeObjectURL(img.src);
        console.log(`Image compressed: ${url} (${result.length} chars)`);
        resolve(result);
      };
      img.onerror = (e) => {
        console.error(`Image element failed to load: ${url}`, e);
        URL.revokeObjectURL(img.src);
        resolve(null);
      };
      img.src = URL.createObjectURL(blob);
    });
  } catch (e) {
    console.error(`compressImage error for ${url}:`, e);
    return null;
  }
}

async function loadLogoAsBase64(): Promise<string | null> {
  // Logo is small (177x177), keep it sharp with max quality and higher resolution
  return compressImage("/logo.png", 800, 800, 1.0, true);
}

export async function generateReportCardPDF(
  data: ReportCardData,
): Promise<string> {
  const doc = new jsPDF({ compress: true });
  registerMontserrat(doc);
  const { athlete, coachName, skillScores, notes, season, groupName, programType } = data;

  // Build skill description lookup from templates
  const templates = programType === 'fundamentalz' ? fundamentalzTemplates : freestylerzTemplates
  const skillDescriptions: Record<string, string> = {}
  templates.forEach(t => t.skills.forEach(s => {
    if (s.description) skillDescriptions[s.id] = s.description
  }))

  // Page dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const thirdPage = pageHeight / 3;
  const lineHeight = 5;

  // ========== TOP THIRD (Header Section) ==========

  // Add pointy mountains in background (bottom of page)
  try {
    const pointyBase64 = await loadPointyAsBase64();
    if (pointyBase64) {
      doc.addImage(pointyBase64, "PNG", -2, pageHeight - 128, pageWidth + 4, 200);
    }
  } catch (_e) {
    console.log("Pointy mountains image not loaded");
  }

  // Add skier logo on top of mountains (PNG for transparency)
  try {
    const skierLogoBase64 = await loadSkierLogoAsBase64();
    if (skierLogoBase64) {
      const skierSize = 80;
      const centerX = (pageWidth - skierSize) / 1.15;
      const centerY = pageHeight - 265;
      doc.addImage(
        skierLogoBase64,
        "PNG",
        centerX,
        centerY,
        skierSize,
        skierSize,
      );
    }
  } catch (_e) {
    console.log("Skier logo image not loaded");
  }

  // Add logo on top left
  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "JPEG", margin, 8, 50, 50);
    } catch (_e) {
      console.log("Logo failed to render:", _e);
    }
  }

  // Brand color
  const brandBlue: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [50, 50, 50];
  const black: [number, number, number] = [0, 0, 0];

  // Right side - Congratulations message (after logo)
  const rightX = margin + 100;
  doc.setFontSize(30);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...brandBlue);
  doc.text("WELL DONE!", rightX, 30);

  // Athlete, Coach, Season and Group Name (middle of top third)
  const topThirdMiddle = thirdPage / 2 + 16;
  doc.setFontSize(14);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...brandBlue);
  doc.text("ATHLETE PROGRESS REPORT", margin, topThirdMiddle - 8);
  doc.setFontSize(12);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...black);
  doc.text(`Athlete: ${athlete.full_name}`, margin, topThirdMiddle);
  doc.setFontSize(10);
  doc.setFont("Montserrat", "normal");
  doc.setTextColor(...darkGray);
  doc.text(`Coach: ${coachName}`, margin, topThirdMiddle + 6);
  doc.text(
    `Group: ${groupName || athlete.group_name || "N/A"}`,
    margin,
    topThirdMiddle + 12,
  );
  doc.text(`Season: ${season}`, margin, topThirdMiddle + 18);

  // Program type removed from PDF per user request

  // ========== MIDDLE THIRD - SKILLS SECTION ==========

  const leftX = margin;

  let currentY = thirdPage - 4;

  // Athlete's Skills and Progressions header
  doc.setFontSize(14);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...brandBlue);
  doc.text("Athlete's Skills and Progressions", leftX, currentY);
  currentY += lineHeight + 1;

  // Legend
  doc.setFontSize(7);
  doc.setFont("Montserrat", "normal");
  doc.setTextColor(...darkGray);
  doc.text("0- N/A | 1- Tried It | 2- Partial Demonstration | 3- Consistent Demonstration | 4- Stomped It!", leftX, currentY);
  currentY += lineHeight + 3;

  // Group skill scores by category
  const groupedSkills: Record<string, SkillScore[]> = {};
  skillScores.forEach((score) => {
    let category = "SKILLS";
    if (score.skill_id.startsWith("training-")) {
      category = "Suggested Training";
    } else if (score.skill_id.startsWith("program-")) {
      category = "Programs for Next Season";
    } else if (score.skill_id === "attendance" || score.skill_id.startsWith("attendance-")) {
      category = "Attendance";
    } else if (score.skill_id.startsWith("effort-participation")) {
      category = "Athlete Participation";
    } else if (score.skill_id.startsWith("moguls-")) {
      category = "Moguls / Bumps";
    } else if (score.skill_id.startsWith("bigair-")) {
      category = "Air Skills";
    } else if (score.skill_id.startsWith("freeski-")) {
      category = "Freeride";
    } else if (score.skill_id.startsWith("jump-")) {
      category = "Air Tricks";
    } else if (score.skill_id.startsWith("park-")) {
      category = "Terrain Park";
    }

    // Only include actual skills (not training/programs)
    if (
      !["Suggested Training", "Programs for Next Season"].includes(category)
    ) {
      if (!groupedSkills[category]) {
        groupedSkills[category] = [];
      }
      groupedSkills[category].push(score);
    }
  });

  // Define the categories for the report card
  const categories = [
    "Attendance",
    "Athlete Participation",
    "Freeride",
    "Moguls / Bumps",
    "Air Tricks",
    "Air Skills",
    "Terrain Park",
  ];
  const skillsStartY = currentY;

  // Layout constants - reduced spacing
  const categoryRowHeight = 6;
  const skillLineHeight = 4;

  // Column positions - category on left, skills in a grid on the right
  const categoryColX = leftX;
  const scoresColX = leftX + 50;
  const numCols = 2; // 2 columns for all categories, aligned with Freeride
  const colWidth = (pageWidth - margin - scoresColX) / numCols;

  let currentRowY = skillsStartY;

  // Draw each category with grid-aligned scores
  categories.forEach((category) => {
    const skills = groupedSkills[category] || [];

    // Category name on the left
    doc.setFontSize(10);
    doc.setFont("Montserrat", "bold");
    doc.setTextColor(...brandBlue);
    doc.text(`${category}:`, categoryColX, currentRowY);

    // Scores in fixed-width columns on the right
    if (skills.length === 0) {
      doc.setFontSize(8);
      doc.setFont("Montserrat", "italic");
      doc.setTextColor(...darkGray);
      doc.text("No skills evaluated", scoresColX, currentRowY);
    } else if (category === "Freeride" || category === "Moguls / Bumps") {
      // Special rendering with descriptions
      const descLineHeight = 2.5;

      let rowStartY = currentRowY;
      let currentRowMaxHeight = skillLineHeight * 1.5;

      skills.forEach((skill, index) => {
        const col = index % numCols;
        const skillX = scoresColX + col * colWidth;
        const skillY = rowStartY;

        const isAttendance = skill.skill_id === "attendance" || skill.skill_id.startsWith("attendance-");
        const isTerrain = skill.skill_id === "moguls-terrain";
        const scoreText = skill.score === 0 ? "N/A" : skill.score != null ? (isAttendance ? `${(skill.score as number) * 25}%` : isTerrain ? ((skill.score as number) <= 2 ? "Green" : "Blue") : skill.score.toString()) : "-";

        // Skill name
        doc.setFontSize(8);
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...darkGray);
        let displayName = skill.skill_name;
        const maxNameWidth = colWidth - 12;
        while (doc.getTextWidth(displayName) > maxNameWidth && displayName.length > 3) {
          displayName = displayName.slice(0, -1);
        }
        if (displayName !== skill.skill_name) displayName += "..";
        doc.text(displayName, skillX, skillY);

        // Score value right-aligned within column
        doc.setFont("Montserrat", "bold");
        doc.setTextColor(...black);
        doc.text(scoreText, skillX + colWidth - 8, skillY);

        // Description on next line
        const description = skillDescriptions[skill.skill_id];
        let skillHeight = skillLineHeight * 1.5;
        if (description) {
          doc.setFontSize(6);
          doc.setFont("Montserrat", "normal");
          doc.setTextColor(...darkGray);
          const wrapped = doc.splitTextToSize(description, colWidth - 12);
          doc.text(wrapped, skillX, skillY + 3);
          skillHeight = 3 + wrapped.length * descLineHeight + 1;
        }

        currentRowMaxHeight = Math.max(currentRowMaxHeight, skillHeight);

        // Advance to next row after last column or last skill
        if (col === numCols - 1 || index === skills.length - 1) {
          rowStartY += currentRowMaxHeight;
          currentRowMaxHeight = skillLineHeight * 1.5;
        }
      });

      currentRowY = rowStartY;
    } else {
      // For Air Tricks, filter out unevaluated skills (score 0 / N/A / null)
      const displaySkills = category === "Air Tricks"
        ? skills.filter(s => s.score !== 0 && s.score !== null && s.score !== undefined)
        : skills;

      // Use 3 columns for Air Tricks with many skills (Freestylerz), 2 for smaller lists
      const catCols = (category === "Air Tricks" && displaySkills.length > 8) ? 3 : numCols;
      const catColWidth = (pageWidth - margin - scoresColX) / catCols;

      doc.setFontSize(8);
      doc.setFont("Montserrat", "normal");
      doc.setTextColor(...black);

      let rowStartY = currentRowY;
      displaySkills.forEach((skill, index) => {
        const col = index % catCols;
        const row = Math.floor(index / catCols);
        const skillX = scoresColX + col * catColWidth;
        const skillY = rowStartY + row * skillLineHeight;

        const isAttendance = skill.skill_id === "attendance" || skill.skill_id.startsWith("attendance-");
        const isTerrain = skill.skill_id === "moguls-terrain";
        const scoreText = skill.score === 0 ? "N/A" : skill.score != null ? (isAttendance ? `${(skill.score as number) * 25}%` : isTerrain ? ((skill.score as number) <= 2 ? "Green" : "Blue") : skill.score.toString()) : "-";
        
        // Skill name (truncated if needed)
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...darkGray);
        let displayName = skill.skill_name;
        // Truncate long names to fit column
        const maxNameWidth = catColWidth - 12;
        while (doc.getTextWidth(displayName) > maxNameWidth && displayName.length > 3) {
          displayName = displayName.slice(0, -1);
        }
        if (displayName !== skill.skill_name) displayName += "..";
        doc.text(displayName, skillX, skillY);

        // Score value right-aligned within column
        doc.setFont("Montserrat", "bold");
        doc.setTextColor(...black);
        doc.text(scoreText, skillX + catColWidth - 8, skillY);
      });

      // Update currentRowY based on number of rows used
      const totalRows = Math.ceil(displaySkills.length / catCols);
      if (totalRows > 1) {
        currentRowY += (totalRows - 1) * skillLineHeight;
      }
    }

    currentRowY += categoryRowHeight - 1;
  });

  // ========== BOTTOM THIRD - WHAT'S NEXT ==========

  // Helper function to check if a training/program score means "Yes"/"Recommended"
  // Handles both new string values and legacy numeric values
  const isTrainingSelected = (score: number | string | null): boolean => {
    if (score === null) return false;
    if (score === "Recommended") return true;
    if (score === "Yes") return true;
    // Legacy numeric values: 3 or 4 means Yes/Recommended
    if (typeof score === "number" && (score === 3 || score === 4)) return true;
    return false;
  };

  const isProgramSelected = (score: number | string | null): boolean => {
    if (score === null) return false;
    if (score === "Yes") return true;
    if (score === "Recommended") return true;
    // Legacy numeric values: 3 or 4 means Yes
    if (typeof score === "number" && (score === 3 || score === 4)) return true;
    return false;
  };

  // Get selected training items
  const selectedTraining = skillScores.filter(
    (s) => s.skill_id.startsWith("training-") && isTrainingSelected(s.score),
  );

  // Get selected programs
  const selectedPrograms = skillScores.filter(
    (s) => s.skill_id.startsWith("program-") && isProgramSelected(s.score),
  );

  // Check if there's anything to show in What's Next
  const hasTrainingOrPrograms =
    selectedTraining.length > 0 || selectedPrograms.length > 0;
  const hasGoals = notes && notes.trim().length > 0;

  // Only show What's Next section if there's something to display
  if (hasTrainingOrPrograms || hasGoals) {
    // Center in bottom third: start at 2/3 + 1/6 = middle of bottom third
    let bottomY = Math.max(currentRowY + 5, thirdPage * 2 + 6);

    // What's Next? header
    doc.setFontSize(14);
    doc.setFont("Montserrat", "bold");
    doc.setTextColor(...brandBlue);
    doc.text("What's Next?", leftX, bottomY);
    bottomY += lineHeight + 2;

    // Training (left) and Programs (right) side by side
    if (hasTrainingOrPrograms) {
      const rightColX = pageWidth / 2 + 5;
      const sectionStartY = bottomY;

      // Suggested Training on the left
      if (selectedTraining.length > 0) {
        doc.setFontSize(10);
        doc.setFont("Montserrat", "bold");
        doc.setTextColor(...darkGray);
        doc.text("Suggested Training:", leftX, bottomY);
        const trainingHeadingWidth = doc.getTextWidth("Suggested Training:  ");
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...black);
        const firstTraining = selectedTraining[0].skill_name.replace(/^Suggested Training:\s*/i, "");
        doc.text(firstTraining, leftX + trainingHeadingWidth, bottomY);

        // Remaining items underneath
        if (selectedTraining.length > 1) {
          doc.setFontSize(9);
          doc.setFont("Montserrat", "normal");
          selectedTraining.slice(1).forEach((skill) => {
            bottomY += lineHeight - 1;
            const displayName = skill.skill_name.replace(/^Suggested Training:\s*/i, "");
            doc.text(displayName, leftX + trainingHeadingWidth, bottomY);
          });
        }
        bottomY += lineHeight;
      }

      // Recommended Programs on the right
      let programsY = sectionStartY;
      if (selectedPrograms.length > 0) {
        doc.setFontSize(10);
        doc.setFont("Montserrat", "bold");
        doc.setTextColor(...darkGray);
        doc.text("Recommended Programs:", rightColX, programsY);
        const programsHeadingWidth = doc.getTextWidth("Recommended Programs:  ");
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...black);
        const firstProgram = selectedPrograms[0].skill_name.replace(/^Programs for Next Season:\s*/i, "");
        doc.text(firstProgram, rightColX + programsHeadingWidth, programsY);

        // Remaining items underneath
        if (selectedPrograms.length > 1) {
          doc.setFontSize(9);
          doc.setFont("Montserrat", "normal");
          selectedPrograms.slice(1).forEach((skill) => {
            programsY += lineHeight - 1;
            const displayName = skill.skill_name.replace(/^Programs for Next Season:\s*/i, "");
            doc.text(displayName, rightColX + programsHeadingWidth, programsY);
          });
        }
        programsY += lineHeight;
      }

      // Use whichever column is taller
      bottomY = Math.max(bottomY, programsY) + 3;
    }

    // Goals underneath Training and Programs
    if (hasGoals) {
      bottomY += 6;
      doc.setFontSize(14);
      doc.setFont("Montserrat", "bold");
      doc.setTextColor(...brandBlue);
      doc.text("Goals for Next Season:", leftX, bottomY);
      bottomY += lineHeight + 1;

      // Comments/goals text
      doc.setFont("Montserrat", "normal");
      doc.setTextColor(...darkGray);
      doc.setFontSize(8);
      const splitComments = doc.splitTextToSize(notes, pageWidth - margin * 2);
      doc.text(splitComments, leftX, bottomY);
    }
  }

  // "See you next season!" at bottom of page
  doc.setFontSize(16);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...brandBlue);
  doc.text("SEE YOU NEXT SEASON!", pageWidth / 2, pageHeight - 28, {
    align: "center",
  });

  // Return PDF as complete data URL
  return doc.output("datauristring");
}

async function loadSkierLogoAsBase64(): Promise<string | null> {
  // Keep as PNG to preserve transparency - no white fill
  try {
    const response = await fetch('/skierlogo.png');
    if (!response.ok) {
      console.error(`Skier logo fetch failed: ${response.status}`);
      return null;
    }
    const blob = await response.blob();
    console.log(`Skier logo fetched: ${blob.size} bytes, ${blob.type}`);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (e) => {
        console.error('Skier logo FileReader error:', e);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('loadSkierLogoAsBase64 error:', e);
    return null;
  }
}

async function loadPointyAsBase64(): Promise<string | null> {
  // Load mountain background directly without compression
  try {
    const response = await fetch('/mountainBg.png');
    if (!response.ok) {
      console.error(`Mountain bg fetch failed: ${response.status}`);
      return null;
    }
    const blob = await response.blob();
    console.log(`Mountain bg fetched: ${blob.size} bytes, ${blob.type}`);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (e) => {
        console.error('Mountain bg FileReader error:', e);
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Mountain bg load error:', e);
    return null;
  }
}

export async function downloadReportCardPDF(
  data: ReportCardData,
): Promise<void> {
  // Generate the PDF and trigger download
  const base64 = await generateReportCardPDF(data);
  const link = document.createElement("a");
  link.href = "data:application/pdf;base64," + base64;
  link.download = `${data.athlete.full_name.replace(/\s+/g, "_")}_Progress_Report.pdf`;
  link.click();
}

export default generateReportCardPDF;
