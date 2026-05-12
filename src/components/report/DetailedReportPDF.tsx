import jsPDF from "jspdf";
import type { Athlete, SkillScore } from "../../types";
import { registerMontserrat } from "../../lib/registerFonts";
import { fundamentalzTemplates, freestylerzTemplates } from "../../data/defaultTemplates";

async function loadLogoAsBase64(): Promise<string | null> {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 700;
        canvas.height = 700;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 700, 700);
        ctx.drawImage(img, 0, 0, 700, 700);
        resolve(canvas.toDataURL("image/jpeg", 1.0));
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  } catch {
    return null;
  }
}

interface DetailedReportData {
  athlete: Athlete;
  coachName: string;
  skillScores: SkillScore[];
  notes: string;
  season: string;
  groupName?: string;
  programType?: string;
  categoryNotes?: Record<string, string>;
}

function getScoreDisplay(skill: SkillScore): string {
  const isAttendance =
    skill.skill_id === "attendance" || skill.skill_id.startsWith("attendance-");
  const isTerrain = skill.skill_id === "moguls-terrain";
  if (skill.score === 0) return "N/A";
  if (skill.score == null) return "-";
  if (isAttendance) return `${(skill.score as number) * 25}%`;
  if (isTerrain)
    return (skill.score as number) <= 2 ? "Green" : "Blue";
  return skill.score.toString();
}

function isTrainingSelected(score: number | string | null): boolean {
  if (score === null) return false;
  if (score === "Recommended") return true;
  if (score === "Yes") return true;
  if (typeof score === "number" && (score === 3 || score === 4)) return true;
  return false;
}

function isProgramSelected(score: number | string | null): boolean {
  if (score === null) return false;
  if (score === "Yes") return true;
  if (score === "Recommended") return true;
  if (typeof score === "number" && (score === 3 || score === 4)) return true;
  return false;
}

function checkPageBreak(
  doc: jsPDF,
  currentY: number,
  neededSpace: number,
  margin: number,
  pageHeight: number
): number {
  if (currentY + neededSpace > pageHeight - margin) {
    doc.addPage();
    return margin + 5;
  }
  return currentY;
}

export async function generateDetailedReport(
  data: DetailedReportData
): Promise<string> {
  const doc = new jsPDF({ compress: true });
  registerMontserrat(doc);

  const {
    athlete,
    coachName,
    skillScores,
    notes,
    season,
    groupName,
    programType,
    categoryNotes,
  } = data;

  // Build skill description lookup from templates
  const templates =
    programType === "fundamentalz"
      ? fundamentalzTemplates
      : freestylerzTemplates;
  const skillDescriptions: Record<string, string> = {};
  templates.forEach((t) =>
    t.skills.forEach((s) => {
      if (s.description) skillDescriptions[s.id] = s.description;
    })
  );

  // Page dimensions
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const darkGray: [number, number, number] = [80, 80, 80];
  const black: [number, number, number] = [0, 0, 0];

  let currentY = margin + 5;

  // ========== LOGO TOP RIGHT ==========
  const logoBase64 = await loadLogoAsBase64();
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "JPEG", pageWidth - margin - 33, margin, 33, 33);
    } catch (_e) {
      console.log("Logo failed to render");
    }
  }

  // ========== TITLE ==========
  doc.setFontSize(16);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...black);
  doc.text("Detailed Athlete Progress Report", margin, currentY);
  currentY += 8;

  // ========== HEADER ==========
  doc.setFontSize(10);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...black);
  doc.text(athlete.full_name, margin, currentY);
  currentY += 5;

  doc.setFontSize(10);
  doc.setFont("Montserrat", "normal");
  doc.setTextColor(...darkGray);
  doc.text(`Coach: ${coachName}`, margin, currentY);
  currentY += 5;
  doc.text(
    `Group: ${groupName || athlete.group_name || "N/A"}`,
    margin,
    currentY
  );
  currentY += 5;
  doc.text(`Season: ${season}`, margin, currentY);
  currentY += 10;

  // ========== ATHLETE'S SKILLS AND PROGRESSIONS ==========
  currentY = checkPageBreak(doc, currentY, 20, margin, pageHeight);

  doc.setFontSize(12);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...black);
  doc.text("Athlete's Skills and Progressions", margin, currentY);
  currentY += 6;

  if (notes && notes.trim().length > 0) {
    currentY = checkPageBreak(doc, currentY, 20, margin, pageHeight);
    doc.setFontSize(9);
    doc.setFont("Montserrat", "normal");
    doc.setTextColor(...darkGray);
    const wrappedNotes = doc.splitTextToSize(notes.trim(), contentWidth);
    doc.text(wrappedNotes, margin, currentY);
    currentY += wrappedNotes.length * 4 + 4;
  }

  // ========== GROUP SKILLS BY CATEGORY ==========
  const groupedSkills: Record<string, SkillScore[]> = {};
  skillScores.forEach((score) => {
    let category = "SKILLS";
    if (score.skill_id.startsWith("training-")) {
      category = "Suggested Training";
    } else if (score.skill_id.startsWith("program-")) {
      category = "Programs for Next Season";
    } else if (
      score.skill_id === "attendance" ||
      score.skill_id.startsWith("attendance-")
    ) {
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

  const categories = [
    "Attendance",
    "Athlete Participation",
    "Freeride",
    "Moguls / Bumps",
    "Air Tricks",
    "Air Skills",
    "Terrain Park",
  ];

  // Layout constants
  const categoryColX = margin;
  const skillsColX = margin + 50; // Skills start to the right of category headings
  const skillsWidth = contentWidth - 50;

  categories.forEach((category) => {
    const skills = groupedSkills[category];
    if (!skills || skills.length === 0) return;

    // Estimate space needed for this category
    let estimatedSpace = 10;
    skills.forEach((skill) => {
      estimatedSpace += 6;
      const desc = skillDescriptions[skill.skill_id];
      if (desc) {
        const wrapped = doc.splitTextToSize(desc, skillsWidth - 5);
        estimatedSpace += wrapped.length * 3;
      }
      if (skill.notes && skill.notes.trim()) {
        const wrapped = doc.splitTextToSize(skill.notes.trim(), skillsWidth - 15);
        estimatedSpace += wrapped.length * 3.5 + 2;
      }
    });

    currentY = checkPageBreak(doc, currentY, Math.min(estimatedSpace, 40), margin, pageHeight);

    // Category heading on the left
    doc.setFontSize(10);
    doc.setFont("Montserrat", "bold");
    doc.setTextColor(...black);
    doc.text(`${category}:`, categoryColX, currentY);

    // Save Y position for metrics (start in line with heading)
    const headingY = currentY;

    // Category coach notes under the heading
    const catNote = categoryNotes && categoryNotes[category];
    let notesEndY = currentY;
    if (catNote && catNote.trim()) {
      notesEndY = currentY + 5;
      notesEndY = checkPageBreak(doc, notesEndY, 10, margin, pageHeight);
      doc.setFontSize(8);
      doc.setFont("Montserrat", "normal");
      doc.setTextColor(...darkGray);
      doc.text("Coach Notes:", categoryColX, notesEndY);
      notesEndY += 4;
      const wrappedCatNote = doc.splitTextToSize(catNote.trim(), 48);
      doc.text(wrappedCatNote, categoryColX, notesEndY);
      notesEndY += wrappedCatNote.length * 3.5 + 3;
    }

    // Start metrics at heading Y level
    currentY = headingY;

    // Air Tricks: render in 3 columns (name + score only)
    if (category === "Air Tricks") {
      const colCount = 3;
      const colWidth = skillsWidth / colCount;
      const rowHeight = 5;
      skills.forEach((skill, index) => {
        const col = index % colCount;
        if (col === 0 && index > 0) {
          currentY += rowHeight;
          currentY = checkPageBreak(doc, currentY, rowHeight, margin, pageHeight);
        }
        const x = skillsColX + col * colWidth;
        const scoreText = getScoreDisplay(skill);
        doc.setFontSize(8);
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...black);
        doc.text(skill.skill_name, x, currentY);
        doc.setFont("Montserrat", "bold");
        const nw = doc.getTextWidth(skill.skill_name);
        doc.text(` ${scoreText}`, x + nw, currentY);
      });
      // Move past the last row
      currentY += rowHeight;
    } else {
      // Standard layout: skills to the right of heading
      skills.forEach((skill, index) => {
        const scoreText = getScoreDisplay(skill);

        // Skill name + score
        if (index > 0) {
          currentY = checkPageBreak(doc, currentY, 8, margin, pageHeight);
        }
        doc.setFontSize(9);
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...black);
        doc.text(skill.skill_name, skillsColX, currentY);

        doc.setFont("Montserrat", "bold");
        const nameWidth = doc.getTextWidth(skill.skill_name);
        doc.text(`  ${scoreText}`, skillsColX + nameWidth, currentY);
        currentY += 4;


        // Coach notes
        if (skill.notes && skill.notes.trim()) {
          currentY = checkPageBreak(doc, currentY, 10, margin, pageHeight);
          doc.setFontSize(8);
          doc.setFont("Montserrat", "bold");
          doc.setTextColor(...darkGray);
          doc.text("Notes:", skillsColX + 5, currentY);
          const notesLabelWidth = doc.getTextWidth("Notes: ");

          doc.setFont("Montserrat", "normal");
          doc.setTextColor(...darkGray);
          const wrappedNotes = doc.splitTextToSize(
            skill.notes.trim(),
            skillsWidth - 20
          );
          doc.text(wrappedNotes, skillsColX + 5 + notesLabelWidth, currentY);
          currentY += wrappedNotes.length * 3.5 + 2;
        }
      });
    }

    // Use whichever column ended lower
    currentY = Math.max(currentY, notesEndY);
    currentY += 4; // Space between categories
  });

  // ========== WHAT'S NEXT ==========
  const selectedTraining = skillScores.filter(
    (s) => s.skill_id.startsWith("training-") && isTrainingSelected(s.score)
  );

  const selectedPrograms = skillScores.filter(
    (s) => s.skill_id.startsWith("program-") && isProgramSelected(s.score)
  );

  const hasTrainingOrPrograms =
    selectedTraining.length > 0 || selectedPrograms.length > 0;

  if (hasTrainingOrPrograms) {
    currentY += 4;
    currentY = checkPageBreak(doc, currentY, 20, margin, pageHeight);

    doc.setFontSize(12);
    doc.setFont("Montserrat", "bold");
    doc.setTextColor(...black);
    doc.text("What's Next:", margin, currentY);
    currentY += 6;

    // Suggested Training
    if (selectedTraining.length > 0) {
      currentY = checkPageBreak(doc, currentY, 10, margin, pageHeight);
      doc.setFontSize(10);
      doc.setFont("Montserrat", "bold");
      doc.setTextColor(...black);
      doc.text("Suggested Training:", categoryColX, currentY);

      doc.setFontSize(9);
      doc.setFont("Montserrat", "normal");
      doc.setTextColor(...black);
      selectedTraining.forEach((skill) => {
        currentY = checkPageBreak(doc, currentY, 5, margin, pageHeight);
        const displayName = skill.skill_name.replace(
          /^Suggested Training:\s*/i,
          ""
        );
        doc.text(displayName, skillsColX, currentY);
        currentY += 4;
      });
    }

    // Programs for Next Season
    if (selectedPrograms.length > 0) {
      currentY += 4;
      currentY = checkPageBreak(doc, currentY, 10, margin, pageHeight);
      doc.setFontSize(10);
      doc.setFont("Montserrat", "bold");
      doc.setTextColor(...black);
      doc.text("Programs for Next Season:", categoryColX, currentY);

      doc.setFontSize(9);
      doc.setFont("Montserrat", "normal");
      doc.setTextColor(...black);
      selectedPrograms.forEach((skill) => {
        currentY = checkPageBreak(doc, currentY, 5, margin, pageHeight);
        const displayName = skill.skill_name.replace(
          /^Programs for Next Season:\s*/i,
          ""
        );
        doc.text(displayName, skillsColX, currentY);
        currentY += 4;
      });
    }

    // Goals for Next Season - only for Freestylerz
    if (programType !== 'fundamentalz') {
      currentY += 4;
      currentY = checkPageBreak(doc, currentY, 15, margin, pageHeight);
      doc.setFontSize(10);
      doc.setFont("Montserrat", "bold");
      doc.setTextColor(...black);
      doc.text("Goals for Next Season:", categoryColX, currentY);
      currentY += 5;

      if (categoryNotes && categoryNotes['Goals for Next Season'] && categoryNotes['Goals for Next Season'].trim()) {
        doc.setFontSize(9);
        doc.setFont("Montserrat", "normal");
        doc.setTextColor(...darkGray);
        const wrappedGoals = doc.splitTextToSize(categoryNotes['Goals for Next Season'].trim(), contentWidth - 10);
        doc.text(wrappedGoals, margin + 5, currentY);
        currentY += wrappedGoals.length * 4 + 2;
      }
    }
  }

  // ========== SEE YOU NEXT SEASON (bottom of page) ==========
  doc.setFontSize(12);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...black);
  doc.text("SEE YOU NEXT SEASON", pageWidth / 2, pageHeight - 15, { align: "center" });

  return doc.output("datauristring");
}

export async function downloadDetailedReport(
  data: DetailedReportData
): Promise<void> {
  const dataUrl = await generateDetailedReport(data);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${data.athlete.full_name.replace(/\s+/g, "_")}_Detailed_Report.pdf`;
  link.click();
}

export default generateDetailedReport;
