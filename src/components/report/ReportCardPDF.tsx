import jsPDF from "jspdf";
import type { Athlete } from "../../types";

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
}

async function compressImage(
  url: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.7,
  fillWhite: boolean = false,
): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();

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

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  } catch (_e) {
    return null;
  }
}

async function loadLogoAsBase64(): Promise<string | null> {
  // Logo is small (177x177), keep it sharp with higher quality
  return compressImage("/logo.png", 200, 200, 0.8, true);
}

export async function generateReportCardPDF(
  data: ReportCardData,
): Promise<string> {
  const doc = new jsPDF({ compress: true });
  const { athlete, coachName, skillScores, notes, season, groupName } = data;

  // Page dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const thirdPage = pageHeight / 3;
  const lineHeight = 5;

  // ========== TOP THIRD (Header Section) ==========

  // Add pointy mountains in background (top third)
  try {
    const pointyBase64 = await loadPointyAsBase64();
    if (pointyBase64) {
      doc.addImage(pointyBase64, "JPEG", 0, thirdPage - 80, pageWidth, 200);
    }
  } catch (_e) {
    console.log("Pointy mountains image not loaded");
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

  // Right side - Congratulations message (after logo)
  const rightX = margin + 60;
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("CONGRATULATIONS!", rightX, 30);

  // Athlete, Coach, Season and Group Name (middle of top third)
  const topThirdMiddle = thirdPage / 2 + 16;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("ATHLETE PROGRESS REPORT", margin, topThirdMiddle - 8);
  doc.setFontSize(11);
  doc.text(`Athlete: ${athlete.full_name}`, margin, topThirdMiddle);
  doc.setFontSize(10);
  doc.text(`Coach: ${coachName}`, margin, topThirdMiddle + 8);
  doc.text(
    `Group: ${groupName || athlete.group_name || "N/A"}`,
    margin,
    topThirdMiddle + 16,
  );
  doc.text(`Season: ${season}`, margin, topThirdMiddle + 24);

  // ========== MIDDLE THIRD - SKILLS SECTION ==========

  const leftX = margin;

  let currentY = thirdPage + 5;

  // Add skier logo in middle section background - larger and centered
  try {
    const skierLogoBase64 = await loadSkierLogoAsBase64();
    if (skierLogoBase64) {
      const skierSize = 120;
      const centerX = (pageWidth - skierSize) / 1.2;
      const centerY = thirdPage + -80;
      doc.addImage(
        skierLogoBase64,
        "JPEG",
        centerX,
        centerY,
        skierSize,
        skierSize,
      );
    }
  } catch (_e) {
    console.log("Skier logo image not loaded");
  }

  // Athlete's Skills and Progressions header - under the mountain/skier image
  currentY += 32;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Athlete's Skills and Progressions", leftX, currentY);
  currentY += lineHeight + 1;

  // Legend
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("1- Area of Focus | 2- Partial Demonstration | 3- Consistent Demonstration | 4- Mastered!", leftX, currentY);
  currentY += lineHeight + 3;

  // Group skill scores by category
  const groupedSkills: Record<string, SkillScore[]> = {};
  skillScores.forEach((score) => {
    let category = "SKILLS";
    if (score.skill_id.startsWith("training-")) {
      category = "Suggested Training";
    } else if (score.skill_id.startsWith("program-")) {
      category = "Programs for Next Season";
    } else if (score.skill_id.startsWith("effort-participation")) {
      category = "Effort & Participation";
    } else if (score.skill_id.startsWith("moguls-")) {
      category = "Moguls";
    } else if (score.skill_id.startsWith("bigair-")) {
      category = "Jumping";
    } else if (score.skill_id.startsWith("freeski-")) {
      category = "Freeskiing";
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

  // Define the 6 categories - displayed with Effort & Participation as two lines
  const categories = [
    "Effort & Participation",
    "Moguls",
    "Air Tricks",
    "Jumping",
    "Freeskiing",
    "Terrain Park",
  ];
  const skillsStartY = currentY;

  // Layout constants - reduced spacing
  const categoryRowHeight = 8;

  // Column positions
  const categoryColX = leftX;
  const scoresColX = leftX + 55;

  let currentRowY = skillsStartY;

  // Draw each category with inline scores
  categories.forEach((category) => {
    const skills = groupedSkills[category] || [];

    // Category name on the left
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${category}:`, categoryColX, currentRowY);

    // Scores inline on the right - with line wrapping for long categories
    if (skills.length === 0) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text("No skills evaluated", scoresColX, currentRowY);
    } else {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      // Spread skills across the line with tight spacing and wrap if needed
      let skillX = scoresColX;
      let skillY = currentRowY;
      const maxX = pageWidth - margin - 5;

      skills.forEach((skill, index) => {
        const scoreText = skill.score ? skill.score.toString() : "-";
        const skillText = `${skill.skill_name}: ${scoreText}`;
        const textWidth = skillText.length * 2.5;

        // Check if this skill would go off the page
        if (skillX + textWidth > maxX && index > 0) {
          // Wrap to next line
          skillY += 5;
          skillX = scoresColX;
        }

        doc.text(skillText, skillX, skillY);
        // Move x position for next skill (approximate width + tight spacing)
        skillX += textWidth + 4;
      });

      // Update currentRowY if we wrapped to multiple lines
      if (skillY > currentRowY) {
        currentRowY = skillY;
      }
    }

    currentRowY += categoryRowHeight + 2;
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
    // Increased gap from skills section (+35 instead of +25)
    let bottomY = thirdPage * 2 + 35;

    // What's Next? header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("What's Next?", leftX, bottomY);
    bottomY += lineHeight + 2;

    // Training (left) and Programs (right) side by side
    if (hasTrainingOrPrograms) {
      const rightColX = pageWidth / 2 + 5;
      const sectionStartY = bottomY;

      // Suggested Training on the left
      if (selectedTraining.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Suggested Training:", leftX, bottomY);
        const trainingHeadingWidth = doc.getTextWidth("Suggested Training:  ");
        doc.setFont("helvetica", "normal");
        const firstTraining = selectedTraining[0].skill_name.replace(/^Suggested Training:\s*/i, "");
        doc.text(firstTraining, leftX + trainingHeadingWidth, bottomY);

        // Remaining items underneath
        if (selectedTraining.length > 1) {
          doc.setFontSize(8);
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
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Recommended Programs:", rightColX, programsY);
        const programsHeadingWidth = doc.getTextWidth("Recommended Programs:  ");
        doc.setFont("helvetica", "normal");
        const firstProgram = selectedPrograms[0].skill_name.replace(/^Programs for Next Season:\s*/i, "");
        doc.text(firstProgram, rightColX + programsHeadingWidth, programsY);

        // Remaining items underneath
        if (selectedPrograms.length > 1) {
          doc.setFontSize(8);
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
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Goals for next season", leftX, bottomY);
      bottomY += lineHeight + 1;

      // Comments/goals text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      const splitComments = doc.splitTextToSize(notes, pageWidth - margin * 2);
      doc.text(splitComments, leftX, bottomY);
    }
  }

  // "See you next season!" at bottom of page
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("See you next season!", pageWidth / 2, pageHeight - 15, {
    align: "center",
  });

  // Return PDF as complete data URL
  return doc.output("datauristring");
}

async function loadSkierLogoAsBase64(): Promise<string | null> {
  // Background image, can be lower quality - 1080x1080 original
  return compressImage("/skierlogo.png", 400, 400, 0.6, true);
}

async function loadPointyAsBase64(): Promise<string | null> {
  // Background mountains - 2480x3508 original, way too large
  // Scale down to 800x400 max for PDF use
  return compressImage("/biggermountains.png", 800, 400, 0.6, true);
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
