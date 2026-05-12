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
    { id: 'moguls-stance', name: 'Stance', description: 'Knees together, Proud upper body, Hands up, Vision up' },
    { id: 'moguls-shape', name: 'Shape', description: 'Quality of turns through moguls' },
    { id: 'moguls-absorption', name: 'Absorption', description: 'Absorption and extension technique' },
  ],
}

// Program-specific Moguls categories
const fundamentalzMoguls: TemplateDefinition = {
  name: 'Moguls / Bumps',
  description: 'Mogul skiing evaluation',
  skills: [
    { id: 'moguls-stance', name: 'Stance', description: 'Strong upper/ lower body and vision up' },
    { id: 'moguls-terrain', name: 'Terrain', description: 'Create a route in Natural Terrain without stopping (5+ turns)' },
    { id: 'moguls-style', name: 'Style', description: 'Pump the moguls' },
  ],
}

const sharedAirSkills: TemplateDefinition = {
  name: 'Air Skills',
  description: 'Jumping skiing evaluation',
  skills: [
    { id: 'bigair-takeoff', name: 'Take Off', description: 'Timing of Takeoff' },
    { id: 'bigair-extension', name: 'Extension', description: 'Extension through all joints' },
    { id: 'bigair-landing', name: 'Landing', description: 'Landing stability and control' },
  ],
}

const sharedAirTricks: TemplateDefinition = {
  name: 'Air Tricks',
  description: 'Air Tricks evaluation',
  skills: [
    { id: 'jump-safety-grab', name: 'Safety Grab', description: 'Safety grab' },
    { id: 'jump-japan-grab', name: 'Japan Grab', description: 'Japan grab' },
    { id: 'jump-mute-grab', name: 'Mute Grab', description: 'Mute grab' },
    { id: 'jump-tip-tail-grabs', name: 'Tip/Tail Grabs', description: 'Tip and tail grab' },
    { id: 'jump-left-spins', name: 'Left Spins', description: 'Left spin progression' },
    { id: 'jump-right-spins', name: 'Right Spins', description: 'Right spin progression' },
    { id: 'jump-switch-left-spins', name: 'Switch Left Spins', description: 'Switch left spin progression' },
    { id: 'jump-switch-right-spins', name: 'Switch Right Spins', description: 'Switch right spin progression' },
    { id: 'jump-spins-with-grab', name: 'Spins with Grab', description: 'Spin combined with grab' },
    { id: 'jump-difficulty', name: 'Difficulty of Trick / Execution', description: 'Complexity and execution quality of tricks' },
  ],
}

const fundamentalzAirTricks: TemplateDefinition = {
  name: 'Air Tricks',
  description: 'Air Tricks evaluation',
  skills: [
    { id: 'jump-grabs', name: 'Grabs', description: 'Grab and style' },
    { id: 'jump-180', name: '180', description: '180 degree rotation' },
    { id: 'jump-360', name: '360', description: '360 degree rotation' },
    { id: 'jump-switch-180', name: 'Switch 180', description: 'Switch 180 degree rotation' },
    { id: 'jump-switch-360', name: 'Switch 360', description: 'Switch 360 degree rotation' },
    { id: 'jump-difficulty', name: 'Difficulty of Trick / Execution', description: 'Complexity and execution quality of tricks' },
  ],
}

const sharedTerrainPark: TemplateDefinition = {
  name: 'Terrain Park',
  description: 'Terrain Park evaluation',
  skills: [
    { id: 'park-safety', name: 'Safety', description: 'Safety awareness and etiquette' },
    { id: 'park-left-box', name: 'Left Foot Box Slide', description: 'Left foot box slide' },
    { id: 'park-right-box', name: 'Right Foot Box Slide', description: 'Right foot box slide' },
    { id: 'park-left-tube', name: 'Left Foot Tube Slide', description: 'Left foot tube slide' },
    { id: 'park-right-tube', name: 'Right Foot Tube Slide', description: 'Right foot tube slide' },
    { id: 'park-switch-box', name: 'Switch Box Slide', description: 'Switch box slide' },
    { id: 'park-switch-tube', name: 'Switch Tube Slide', description: 'Switch tube slide' },
    { id: 'park-front-270-out', name: 'Front 270 Out', description: 'Front 270 out' },
    { id: 'park-back-270-out', name: 'Back 270 Out', description: 'Back 270 out' },
    { id: 'park-switch-up', name: 'Switch Up', description: 'Switch up' },
    { id: 'park-270-on', name: '270 On', description: '270 on' },
  ],
}

const fundamentalzTerrainPark: TemplateDefinition = {
  name: 'Terrain Park',
  description: 'Terrain Park evaluation',
  skills: [
    { id: 'park-safety', name: 'Safety', description: 'Safety awareness and etiquette' },
    { id: 'park-box-5050', name: 'Box Slide 50/50', description: 'Box slide 50/50' },
    { id: 'park-box-sideways', name: 'Box Slide Sideways', description: 'Box slide sideways' },
    { id: 'park-box-switch-5050', name: 'Switch Box Slide 50/50', description: 'Switch box slide 50/50' },
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
    { id: 'freeski-spinning', name: 'Spinning on Snow', description: '360s and spins on flat snow' },
    { id: 'freeski-control', name: 'Skiing with Control', description: 'Overall control and style' },
  ],
}

// Assembled template arrays
export const fundamentalzTemplates: TemplateDefinition[] = [
  sharedAttendance,
  sharedParticipation,
  fundamentalzFreeride,
  fundamentalzMoguls,
  sharedAirSkills,
  fundamentalzAirTricks,
  fundamentalzTerrainPark,
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
