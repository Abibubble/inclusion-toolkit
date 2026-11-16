/** What each resource is about, in the order the filters list them */
export const TOPICS = {
  design: 'Design',
  development: 'Development',
  content: 'Content and writing',
  testing: 'Testing',
  planning: 'Planning and process',
  'colour-and-vision': 'Colour and vision',
  documents: 'Documents and presentations',
  'social-media': 'Social media',
  meetings: 'Meetings and events',
  'ways-of-working': 'Ways of working',
  language: 'Language and symbols',
  'health-conditions': 'Health conditions',
  'neurodivergent-conditions': 'Neurodivergent conditions',
} as const;

export type Topic = keyof typeof TOPICS;

/** Who each resource is for, in the order the filters list them */
export const AUDIENCES = {
  everyone: 'Everyone',
  designers: 'Designers',
  developers: 'Developers',
  'content-writers': 'Content writers',
  'product-managers': 'Product managers',
  managers: 'Managers and team leads',
} as const;

export type Audience = keyof typeof AUDIENCES;

export function topicNames(topics: readonly Topic[]): string[] {
  return topics.map((topic) => TOPICS[topic]);
}

export function audienceNames(audiences: readonly Audience[]): string[] {
  return audiences.map((audience) => AUDIENCES[audience]);
}
