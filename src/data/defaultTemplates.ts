import type { Skill } from '../types'

export interface TemplateDefinition {
  name: string
  description: string
  skills: Skill[]
}

// Shared categories (identical across both programs)
const sharedAttendance: TemplateDefinition = {
  name: 'Attendance',
  description: 'Athlete attendance tracking',
  skills: [
    { id: 'attendance', name: 'Attendance', description: 'Percentage of sessions attended' },
  ],
}

const sharedParticipation: TemplateDefinition = {
  name: 'Athlete Participation',
  description: 'Overall athlete participation evaluation',
  skills: [
    { id: 'effort-participation', name: 'Attitude & Engagement', description: 'Overall attitude and engagement in training' },
  ],
}

const sharedMoguls: TemplateDefinition = {
  name: 'Moguls / Bumps',
  description: 'Mogul skiing evaluation',
  skills: [
    { id: 'moguls-stance', name: 'Stance', description: 'Body position and balance' },
    { id: 'moguls-shape', name: 'Shape', description: 'Quality of turns through moguls' },
    { id: 'moguls-absorption', name: 'Absorption', description: 'Absorption and extension technique' },
  ],
}

const sharedAirSkills: TemplateDefinition = {
  name: 'Air Skills',
  description: 'Jumping skiing evaluation',
  skills: [
    { id: 'bigair-takeoff', name: 'Take Off', description: 'Quality of jump takeoff' },
    { id: 'bigair-extension', name: 'Extension', description: 'Body extension in the air' },
    { id: 'bigair-amplitude', name: 'Amplitude', description: 'Height and distance achieved' },
    { id: 'bigair-landing', name: 'Landing', description: 'Landing stability and control' },
  ],
}

const sharedAirTricks: TemplateDefinition = {
  name: 'Air Tricks',
  description: 'Air Tricks evaluation',
  skills: [
    { id: 'jump-difficulty', name: 'Difficulty of Trick / Execution', description: 'Complexity and execution quality of tricks' },
    { id: 'jump-grabs', name: 'Grabs', description: 'Grab technique and style' },
    { id: 'jump-spins', name: 'Spins', description: 'Spin control and rotation' },
  ],
}

const sharedTerrainPark: TemplateDefinition = {
  name: 'Terrain Park',
  description: 'Terrain Park evaluation',
  skills: [
    { id: 'park-safety', name: 'Safety', description: 'Safety awareness and etiquette' },
    { id: 'park-boxes', name: 'Boxes', description: 'Box slide skills' },
    { id: 'park-rails', name: 'Tubes', description: 'Tube slide skills' },
    { id: 'park-wall', name: 'Hip / Quarter Pipe / Wall Ride', description: 'Hip, quarter pipe and wall ride skills' },
  ],
}

const sharedSuggestedTraining: TemplateDefinition = {
  name: 'Suggested Training',
  description: 'Recommended training programs and activities',
  skills: [
    { id: 'training-whistler-spring', name: 'Whistler Spring Camp', description: 'Spring training camp at Whistler' },
    { id: 'training-spring-trampoline', name: 'Trampoline', description: 'Trampoline training' },
    { id: 'training-spring-dryland', name: 'Dryland', description: 'Dryland training' },
    { id: 'training-spring-water', name: 'Water Ramps', description: 'Water ramp training' },
  ],
}

const sharedProgramsNextSeason: TemplateDefinition = {
  name: 'Programs for Next Season',
  description: 'Recommended programs for next season',
  skills: [
    { id: 'program-fundamentalz', name: 'FUNdamentalz', description: 'Entry-level freestyle program' },
    { id: 'program-freestylerz', name: 'Freestylerz', description: 'Intermediate freestyle program' },
    { id: 'program-night', name: 'Night Riders', description: 'Evening training program' },
    { id: 'program-girlstylerz', name: 'Girlstylerz', description: 'Girls freestyle program' },
    { id: 'program-dev', name: 'DEV Team (Invite Required)', description: 'Development team - invitation only' },
  ],
}

// Program-specific Freeride categories (only descriptions differ on 5 skills)
const fundamentalzFreeride: TemplateDefinition = {
  name: 'Freeride',
  description: 'Freeskiing evaluation',
  skills: [
    { id: 'freeski-stance-balance', name: 'Stance & Balance', description: 'Vision, Hand Position, Forward Pressure' },
    { id: 'freeski-steering-edging', name: 'Steering & Edging', description: 'Hockey Stop in both directions safely, Skate on a cat track, Activate Edges' },
    { id: 'freeski-pressure-absorption', name: 'Pressure Control / Absorption', description: 'Roll side hits, Natural Rollers, bumps without leaving snow' },
    { id: 'freeski-timing-coordination', name: 'Timing & Coordination', description: 'Pole planting, Correct jump timing' },
    { id: 'freeski-freeride-style', name: 'Freeride Style / Impression', description: 'Overall freeride style and impression' },
    { id: 'freeski-switch', name: 'Switch Skiing', description: 'Pizza vs Parallel skis, Vision up' },
    { id: 'freeski-switch-stops', name: 'Controlled Stops', description: 'Controlled stops while skiing switch' },
    { id: 'freeski-spinning', name: 'Spinning on Snow', description: '360s and spins on flat snow' },
    { id: 'freeski-control', name: 'Skiing with Control', description: 'Overall control and style' },
  ],
}

const freestylerzFreeride: TemplateDefinition = {
  name: 'Freeride',
  description: 'Freeskiing evaluation',
  skills: [
    { id: 'freeski-stance-balance', name: 'Stance & Balance', description: 'Correct angulation through hips, knees & ankles. Shoulders & hips aligned. Arm height & head position comfortable & upright' },
    { id: 'freeski-steering-edging', name: 'Steering & Edging', description: 'Flat 180-360 on snow, Ability to change radius of turn at any time' },
    { id: 'freeski-pressure-absorption', name: 'Pressure Control / Absorption', description: 'Creative/ Buttering. Carve ski while turning without losing control' },
    { id: 'freeski-timing-coordination', name: 'Timing & Coordination', description: 'Pole plant consistently, 4 phases of the turn' },
    { id: 'freeski-freeride-style', name: 'Freeride Style / Impression', description: 'Overall freeride style and impression' },
    { id: 'freeski-switch', name: 'Switch Skiing', description: 'Comfort on Greens vs Blues, Ski whole run switch safely, Vision in right place' },
    { id: 'freeski-switch-stops', name: 'Controlled Stops', description: 'Controlled stops while skiing switch' },
    { id: 'freeski-spinning', name: 'Spinning on Snow', description: '360s and spins on flat snow' },
    { id: 'freeski-control', name: 'Skiing with Control', description: 'Overall control and style' },
  ],
}

// Assembled template arrays
export const fundamentalzTemplates: TemplateDefinition[] = [
  sharedAttendance,
  sharedParticipation,
  fundamentalzFreeride,
  sharedMoguls,
  sharedAirSkills,
  sharedAirTricks,
  sharedTerrainPark,
  sharedSuggestedTraining,
  sharedProgramsNextSeason,
]

export const freestylerzTemplates: TemplateDefinition[] = [
  sharedAttendance,
  sharedParticipation,
  freestylerzFreeride,
  sharedMoguls,
  sharedAirSkills,
  sharedAirTricks,
  sharedTerrainPark,
  sharedSuggestedTraining,
  sharedProgramsNextSeason,
]

// Default / fallback
export const defaultTemplates: TemplateDefinition[] = freestylerzTemplates
