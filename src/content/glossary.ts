export interface GlossaryTerm {
  /** The word or phrase. Other names for the same thing are split by a slash, such as "Tooltip / popover" */
  term: string;
  definition: string;
  /**
   * False for words that also have an everyday meaning, such as focus, so they aren't linked to the
   * glossary wherever they're used
   */
  link?: false;
}

/** The term's place on the Glossary page, such as "alt-text", which links to it */
export function glossaryId(term: string): string {
  return term
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Technical words used on the site, explained in plain words, for the Glossary page (WCAG 3.1.3).
 * The first use of each one on a toolkit page links here. Abbreviations have their own list. In
 * alphabetical order, and written without abbreviations, so nothing in a definition needs
 * explaining itself. Most come from the glossary at the end of the Accessibility Highlights
 */
export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'A11y',
    definition:
      'A short way of writing accessibility. The 11 stands for the 11 letters between the a and the y.',
  },
  {
    term: 'Ableism / ableist',
    definition: 'Treating disabled people unfairly, or as less important than other people.',
  },
  {
    term: 'Ableist language',
    definition:
      'Words that use disability as an insult or a negative image, such as ‘lame’ or ‘blind spot’.',
  },
  {
    term: 'Accessibility debt',
    definition: 'Accessibility problems that build up when accessibility is left until later.',
  },
  {
    term: 'Accessibility overlay',
    definition:
      'An add-on from another company that claims to fix a website’s accessibility problems automatically.',
  },
  {
    term: 'Accommodations',
    definition:
      'Changes that let a disabled or neurodivergent person work or take part on equal terms. In the United Kingdom these are often called reasonable adjustments.',
  },
  {
    term: 'Action items / action points',
    definition: 'Tasks that someone agreed in a meeting to do afterwards.',
  },
  {
    term: 'Adolescence',
    definition: 'The years when a child is growing into an adult.',
  },
  {
    term: 'Algorithm',
    definition: 'The set of rules a website uses to choose what to show people.',
  },
  {
    term: 'Ally / allies',
    definition: 'Someone who supports a group they aren’t part of, and speaks up for it.',
  },
  {
    term: 'Alt text',
    definition: 'A short written description of an image, read out by screen readers.',
  },
  {
    term: 'Antibodies',
    definition: 'Proteins the immune system makes to find and fight germs.',
  },
  {
    term: 'Antimalarials',
    definition:
      'Medicines first made for malaria, which can also calm an overactive immune system, such as in lupus.',
  },
  {
    term: 'Arthritis',
    definition: 'Pain, swelling, and stiffness in one or more joints.',
  },
  {
    term: 'Assistive technology',
    definition:
      'Tools that help disabled people use a device, such as screen readers, magnifiers, switches, and voice control.',
  },
  {
    term: 'Astigmatism',
    definition:
      'An eye condition where the shape of the eye makes things look blurry or stretched.',
  },
  {
    term: 'Attribute',
    definition: 'An extra setting inside a piece of page code, which changes how that part works.',
  },
  {
    term: 'Audiologist',
    definition: 'A health worker who tests hearing and fits hearing aids.',
  },
  {
    term: 'Auditory processing disorder',
    definition:
      'Trouble making sense of sounds, such as speech in a noisy room, even though hearing is normal.',
  },
  {
    term: 'Autocomplete / autofill',
    definition: 'When a browser or password manager fills in saved details for you.',
  },
  {
    term: 'Autoimmune',
    definition:
      'When the immune system, which normally fights germs, attacks healthy parts of the body by mistake.',
  },
  {
    term: 'Backlog',
    definition: 'A list of work a team plans to do.',
  },
  {
    term: 'Biometrics',
    definition: 'Using a fingerprint or face scan to sign in.',
  },
  {
    term: 'Biopsy / biopsies',
    definition: 'Taking a tiny piece of the body, so it can be looked at under a microscope.',
  },
  {
    term: 'Botox',
    definition:
      'Injections into the muscles of the head and neck, which can make migraines happen less often.',
  },
  {
    term: 'Brain fog',
    definition: 'Feeling slow, confused, or unable to think clearly.',
  },
  {
    term: 'Breadcrumbs',
    definition:
      'A trail of links showing where a page sits on a website, such as Home, then Accessibility, then Buttons.',
  },
  {
    term: 'Breakout area',
    definition: 'A shared space in an office, away from desks, where people can talk or relax.',
  },
  {
    term: 'Burnout',
    definition:
      'Being so worn out, in body and mind, that you can’t cope with everyday things, often for a long time.',
  },
  {
    term: 'CamelCase',
    definition: 'Writing each word in a hashtag with a capital letter, such as #SuperBowl.',
  },
  {
    term: 'Captions',
    definition:
      'Text on screen showing the speech and important sounds in a video, a meeting, or a live event.',
  },
  {
    term: 'Carousel',
    definition: 'A banner that moves through a set of images or messages.',
  },
  {
    term: 'Cataracts',
    definition: 'Cloudy patches in the lens of the eye that make sight blurry.',
  },
  {
    term: 'Cerebral palsy',
    definition:
      'A condition that affects movement and coordination, caused by damage to the brain before, during, or soon after birth.',
  },
  {
    term: 'Chemotherapy',
    definition: 'Strong medicine that kills cancer cells.',
  },
  {
    term: 'Chronic',
    definition: 'Lasting a long time, or coming back again and again.',
  },
  {
    term: 'Closed captions',
    definition: 'Captions that each viewer can choose to turn on or off.',
  },
  {
    term: 'Co-occur',
    definition: 'When two or more conditions often happen in the same person.',
  },
  {
    term: 'Cochlear implant',
    definition:
      'A small device fitted inside the ear by surgery, which helps some deaf people hear sounds.',
  },
  {
    term: 'Cognitive',
    definition: 'To do with thinking, memory, attention, and understanding.',
  },
  {
    term: 'Colonoscopy / colonoscopies',
    definition: 'A test that uses a thin tube with a camera to look inside the bowel.',
  },
  {
    term: 'Colour contrast ratio',
    definition:
      'How different two colours are in brightness. A higher number is easier to read, such as 4.5 to 1.',
  },
  {
    term: 'Component',
    definition: 'A reusable part of a web page, such as a button or a menu.',
  },
  {
    term: 'Component library / design system',
    definition:
      'A shared set of ready-made, tested parts, such as buttons and forms, used to build products.',
  },
  {
    term: 'Compulsions',
    definition: 'Actions or thoughts someone feels they must repeat to ease their anxiety.',
  },
  {
    term: 'Coprolalia',
    definition: 'Tics that involve saying swear words or other rude words.',
  },
  {
    term: 'Crohn’s disease',
    definition:
      'A long-term illness where parts of the gut become swollen and sore, which can cause pain, diarrhoea, and tiredness.',
  },
  {
    term: 'CSS pixel',
    definition: 'A unit of size in page code, which stays about the same size on every screen.',
  },
  {
    term: 'Cursor',
    definition: 'The pointer or marker on a screen that shows where you’re pointing or typing.',
  },
  {
    term: 'Cyst',
    definition: 'A small sac of fluid in the body.',
  },
  {
    term: 'd/Deaf',
    definition:
      'A way of writing that includes people who are deaf, and people who are part of the Deaf community, which has its own culture and sign language.',
  },
  {
    term: 'Debilitating',
    definition: 'So bad that it stops you doing everyday things.',
  },
  {
    term: 'Decorative image',
    definition: 'An image that adds nothing to the meaning, so screen readers can skip it.',
  },
  {
    term: 'Developmental milestones',
    definition: 'Skills most children learn by a certain age, such as walking or talking.',
  },
  {
    term: 'Dopamine',
    definition:
      'A chemical messenger in the brain that helps control movement, attention, and motivation.',
  },
  {
    term: 'Dyscalculia',
    definition: 'A learning difference that makes numbers and maths hard to understand.',
  },
  {
    term: 'Dysgraphia',
    definition:
      'A learning difference that makes handwriting, and turning thoughts into written words, hard.',
  },
  {
    term: 'Dyspraxia',
    definition:
      'A difference that affects movement and coordination, and sometimes planning and organising.',
  },
  {
    term: 'Educational psychologist',
    definition: 'A specialist who assesses how children and adults learn, and what support helps.',
  },
  {
    term: 'Electroencephalogram',
    definition:
      'A test that records the brain’s electrical activity, using small sensors on the scalp.',
  },
  {
    term: 'Email client',
    definition: 'The app or website you use to read your email.',
  },
  {
    term: 'Emotional dysregulation',
    definition: 'Finding it very hard to manage strong feelings.',
  },
  {
    term: 'Emotional regulation',
    definition: 'Being able to manage and recover from strong feelings.',
  },
  {
    term: 'Endometriosis',
    definition:
      'Tissue like the lining of the womb growing in other places, such as the ovaries, which causes pain.',
  },
  {
    term: 'Executive function',
    definition:
      'The brain skills used to plan, organise, start tasks, remember instructions, and manage time.',
  },
  {
    term: 'Exposure therapy',
    definition:
      'A treatment where someone slowly and safely faces what they fear, until it feels less frightening.',
  },
  {
    term: 'Facilitator',
    definition: 'The person who runs a meeting and makes sure everyone gets a chance to speak.',
  },
  {
    term: 'Fibromyalgia',
    definition:
      'Long-term pain all over the body, often with extreme tiredness and trouble sleeping.',
  },
  {
    term: 'Fidget tools',
    definition: 'Small objects people can hold and move to help them focus or feel calm.',
  },
  {
    term: 'Fine motor skills',
    definition: 'Small, careful hand movements, such as writing or doing up buttons.',
  },
  {
    term: 'Flare-up / flare',
    definition: 'A time when symptoms suddenly get worse.',
  },
  {
    term: 'Focus',
    definition: 'Which part of a page is active, and will react to the keyboard.',
    link: false,
  },
  {
    term: 'Focus state',
    definition: 'How an element looks when it has focus, such as a visible outline.',
  },
  {
    term: 'Focus trap',
    definition: 'When keyboard users can’t move away from part of a page.',
  },
  {
    term: 'Gait',
    definition: 'The way a person walks.',
  },
  {
    term: 'Gesture',
    definition: 'A touch action, such as a swipe, pinch, or multi-finger tap.',
  },
  {
    term: 'Glucose',
    definition: 'The main sugar in the blood, and the body’s main source of energy.',
  },
  {
    term: 'Greyscale',
    definition: 'Showing only black, white, and shades of grey.',
  },
  {
    term: 'Hatching',
    definition:
      'Lines drawn close together to fill a shape, so it can be told apart without colour.',
  },
  {
    term: 'Hearing loop / loop system',
    definition: 'A system that sends sound straight to hearing aids, cutting out background noise.',
  },
  {
    term: 'Heatmap',
    definition: 'A chart that uses colour to show where values are high or low.',
  },
  {
    term: 'Hover state',
    definition: 'How an element looks when a mouse pointer is over it.',
  },
  {
    term: 'Hue',
    definition: 'The shade or tint of a colour.',
  },
  {
    term: 'Hybrid meeting / hybrid',
    definition: 'A meeting where some people are in the room and others join online.',
  },
  {
    term: 'Hyperactive-impulsive type',
    definition:
      'A kind of attention deficit hyperactivity disorder where people mainly feel restless and act without thinking first.',
  },
  {
    term: 'Hypo',
    definition:
      'Short for hypoglycaemia, when blood sugar drops too low, which can cause shaking, sweating, and confusion.',
  },
  {
    term: 'Hysterectomy',
    definition: 'An operation to remove the womb.',
  },
  {
    term: 'Identity-first language',
    definition: 'Putting the identity first, such as ‘an autistic person’.',
  },
  {
    term: 'Immunosuppressants',
    definition: 'Medicines that make the immune system less active.',
  },
  {
    term: 'Immunotherapy',
    definition: 'Treatment that helps the immune system fight cancer.',
  },
  {
    term: 'Impulsivity',
    definition: 'Acting quickly without thinking first.',
  },
  {
    term: 'Inattentive type',
    definition:
      'A kind of attention deficit hyperactivity disorder where people mainly find it hard to focus, without feeling restless.',
  },
  {
    term: 'Inflammation / inflammatory',
    definition:
      'When part of the body becomes red, swollen, hot, or painful as it reacts to an injury or illness.',
  },
  {
    term: 'Infographic',
    definition:
      'An image that uses pictures, charts, and short text together to share information.',
  },
  {
    term: 'Insulin',
    definition: 'A hormone that lets the body take in sugar from food and use it for energy.',
  },
  {
    term: 'Interactive element',
    definition: 'Anything you can click, tap, or type into, such as a link, button, or form field.',
  },
  {
    term: 'Intrusive thoughts',
    definition:
      'Unwanted, upsetting thoughts that come into someone’s mind and are hard to get rid of.',
  },
  {
    term: 'Jargon',
    definition: 'Special words used by a group of people, which others may not understand.',
  },
  {
    term: 'JavaScript',
    definition: 'A programming language that makes web pages interactive.',
  },
  {
    term: 'Landmark',
    definition:
      'A labelled area of a web page, such as the navigation or main content, that screen reader users can jump to.',
  },
  {
    term: 'Lanyard',
    definition: 'A strap worn around the neck to hold a badge or card.',
  },
  {
    term: 'Level A / Level AA / Level AAA',
    definition:
      'The three levels of the Web Content Accessibility Guidelines. Level A is the lowest, Level AA is the middle, and Level AAA is the highest.',
  },
  {
    term: 'Lived experience',
    definition: 'What someone knows from going through something in their own life.',
  },
  {
    term: 'Lumbar puncture',
    definition:
      'A test where a thin needle takes a small amount of fluid from around the spine, in the lower back.',
  },
  {
    term: 'Luminance',
    definition: 'How bright a colour looks.',
  },
  {
    term: 'Lupus',
    definition: 'An autoimmune illness that can affect the skin, joints, and organs.',
  },
  {
    term: 'Magic link',
    definition: 'A one-time sign-in link sent by email.',
  },
  {
    term: 'Markdown',
    definition: 'A simple way of writing formatted text, using symbols such as # for headings.',
  },
  {
    term: 'Masking',
    definition: 'Hiding or changing your natural behaviour to fit in with other people.',
  },
  {
    term: 'Media query',
    definition:
      'A rule in a page’s style code that changes how the page looks, based on the device or the user’s settings.',
  },
  {
    term: 'Mindfulness',
    definition: 'Paying calm attention to what’s happening right now.',
  },
  {
    term: 'Modal',
    definition:
      'A pop-up window that appears on top of a page, and must be closed before you go back to the page.',
  },
  {
    term: 'Monochromacy',
    definition: 'Seeing little or no colour.',
  },
  {
    term: 'Motor impairment',
    definition: 'A disability that affects movement, such as tremors or limited use of the hands.',
  },
  {
    term: 'Multiple sclerosis',
    definition:
      'A condition where the immune system damages the coating around the nerves in the brain and spine, which can affect movement, sight, and balance.',
  },
  {
    term: 'Neurodivergent',
    definition:
      'Describes a person whose brain works differently from what society thinks is ‘typical’.',
  },
  {
    term: 'Neurodiverse',
    definition:
      'Describes a group of people with different types of brains, such as a team of neurotypical and neurodivergent people. A single person can’t be neurodiverse.',
  },
  {
    term: 'Neurodiversity',
    definition:
      'The natural differences in how people’s brains work, including autism, attention deficit hyperactivity disorder, dyslexia, and dyspraxia.',
  },
  {
    term: 'Neuroinclusive',
    definition: 'Designed to work well for people whose brains work in different ways.',
  },
  {
    term: 'Neurological',
    definition: 'To do with the brain and nerves.',
  },
  {
    term: 'Neurologist',
    definition: 'A doctor for conditions of the brain and nerves.',
  },
  {
    term: 'Neurotype',
    definition: 'A type of brain, such as autistic, dyslexic, or neurotypical.',
  },
  {
    term: 'Neurotypical',
    definition:
      'Describes people whose brains work in the way society thinks is ‘typical’. It means people who aren’t neurodivergent.',
  },
  {
    term: 'Obsessions',
    definition: 'Unwanted thoughts, worries, or images that keep coming back.',
  },
  {
    term: 'Occupational therapy',
    definition: 'Help to make everyday tasks easier at home, at school, or at work.',
  },
  {
    term: 'One-time code',
    definition: 'A short code sent by text message or an app, that you use once to sign in.',
  },
  {
    term: 'Open-plan office',
    definition: 'An office with no walls between the desks.',
  },
  {
    term: 'Optometrist',
    definition: 'A person trained to test eyesight and check eye health.',
  },
  {
    term: 'Osteoarthritis',
    definition:
      'The most common kind of arthritis, where the smooth surface inside a joint wears down, making it stiff and painful.',
  },
  {
    term: 'Paediatrician',
    definition: 'A children’s doctor.',
  },
  {
    term: 'Palpitations',
    definition: 'Feeling your heart beat fast, hard, or unevenly.',
  },
  {
    term: 'Parkinson’s',
    definition:
      'A condition where nerve cells in the brain stop working over time, causing shaking, stiffness, and slow movement.',
  },
  {
    term: 'Pelvic',
    definition: 'To do with the lower part of the abdomen, between the hips.',
  },
  {
    term: 'Peripheral vision',
    definition: 'What you can see at the sides while you look straight ahead.',
  },
  {
    term: 'Person-first language',
    definition: 'Putting the person first, such as ‘a person with vision loss’.',
  },
  {
    term: 'Persona',
    definition:
      'A made-up but realistic person, used to test whether a product works for different people.',
  },
  {
    term: 'Photophobia',
    definition: 'When light hurts your eyes or makes you uncomfortable.',
  },
  {
    term: 'Photosensitive epilepsy',
    definition: 'Epilepsy where seizures can be triggered by flashing or flickering light.',
  },
  {
    term: 'Photosensitivity',
    definition: 'When flashing or flickering light can cause discomfort or seizures.',
  },
  {
    term: 'Physiotherapy',
    definition: 'Exercises and hands-on treatment that help the body move better.',
  },
  {
    term: 'Plain English',
    definition: 'Simple, everyday words that are easy to understand.',
  },
  {
    term: 'Prevalence',
    definition: 'How common something is.',
  },
  {
    term: 'Programmatically',
    definition: 'Done in the page’s code, so that software such as screen readers can detect it.',
  },
  {
    term: 'Pronouns',
    definition:
      'The words used to talk about someone without using their name, such as she, he, or they.',
  },
  {
    term: 'Psychiatrist',
    definition: 'A medical doctor who treats mental health conditions.',
  },
  {
    term: 'Radio button',
    definition: 'A small round button in a list, where you can choose only one option.',
  },
  {
    term: 'Radiotherapy',
    definition: 'Treatment that uses high-energy rays to kill cancer cells.',
  },
  {
    term: 'Reflow',
    definition:
      'When a page rearranges itself to fit the screen, so you don’t need to scroll sideways.',
  },
  {
    term: 'Relapse',
    definition: 'When symptoms come back or get worse, after a better period.',
  },
  {
    term: 'Retina',
    definition: 'The layer at the back of the eye that senses light.',
  },
  {
    term: 'Rheumatoid arthritis',
    definition: 'Arthritis caused by the immune system attacking the joints.',
  },
  {
    term: 'Rheumatologist',
    definition:
      'A doctor for conditions of the joints, muscles and bones, and autoimmune illnesses.',
  },
  {
    term: 'Rituals',
    definition: 'Actions someone feels they must do in a set way, to ease their anxiety.',
  },
  {
    term: 'Sans serif / sans-serif',
    definition: 'Lettering without the small lines at the ends of the strokes.',
  },
  {
    term: 'Screen magnifier',
    definition: 'Software that makes part of the screen bigger.',
  },
  {
    term: 'Screen reader',
    definition:
      'Software that reads out what’s on the screen, used by many blind and partially sighted people.',
  },
  {
    term: 'Screening',
    definition: 'Testing people who don’t have symptoms, to find a condition early.',
  },
  {
    term: 'Seizure',
    definition:
      'A sudden burst of electrical activity in the brain, which can cause shaking, staring, or loss of awareness.',
  },
  {
    term: 'Selective serotonin reuptake inhibitors',
    definition:
      'A common type of antidepressant, also used for anxiety and obsessive-compulsive disorder.',
  },
  {
    term: 'Semantic HTML',
    definition:
      'Using the page code that matches what each part of a page is, such as a button element for a button.',
  },
  {
    term: 'Sensory diet',
    definition:
      'A plan of daily activities that gives someone the sensory input they need to feel calm and focused.',
  },
  {
    term: 'Sensory integration therapy',
    definition: 'Therapy that helps the brain handle information from the senses.',
  },
  {
    term: 'Sensory overload / sensory overwhelm',
    definition:
      'When there’s more noise, light, or other input than the brain can handle, so it feels overwhelming.',
  },
  {
    term: 'Sensory processing disorder',
    definition:
      'When the brain finds it hard to handle information from the senses, such as sound, light, or touch.',
  },
  {
    term: 'Shifting left',
    definition: 'Thinking about accessibility at the start of a project, rather than the end.',
  },
  {
    term: 'Skip link',
    definition:
      'A link at the top of a page that lets keyboard and screen reader users jump past the navigation.',
  },
  {
    term: 'Small talk',
    definition:
      'Friendly chat about everyday things, such as the weather, before getting to the main point.',
  },
  {
    term: 'Social cues',
    definition:
      'The signals people give without words, such as facial expressions and tone of voice.',
  },
  {
    term: 'Spectrum',
    definition:
      'A wide range of ways something can show up, rather than a single line from less to more.',
  },
  {
    term: 'Steroids',
    definition: 'Strong medicines that reduce inflammation.',
  },
  {
    term: 'Sticky header',
    definition: 'A bar that stays at the top of the screen when you scroll.',
  },
  {
    term: 'Stigma',
    definition: 'Negative and unfair beliefs about a group of people.',
  },
  {
    term: 'Stimming',
    definition:
      'Repeated movements or sounds, such as rocking, tapping, or humming, that help someone feel calm or focus.',
  },
  {
    term: 'Strobe light / strobing',
    definition: 'A light that flashes on and off very quickly.',
  },
  {
    term: 'Switch device',
    definition:
      'A single button or similar device used to control a computer, for people with limited movement.',
  },
  {
    term: 'Systemic',
    definition: 'Affecting the whole body, not just one part.',
  },
  {
    term: 'Tagged PDF / tagging',
    definition:
      'A document file with hidden structure, such as headings, lists, and reading order, that screen readers can use.',
  },
  {
    term: 'Tap target',
    definition: 'The area of a button or link you can tap or click.',
  },
  {
    term: 'Targeted therapy / targeted therapies',
    definition: 'Medicine that attacks particular weak points in cancer cells.',
  },
  {
    term: 'Technical debt',
    definition: 'Extra work that builds up later, when a team takes shortcuts now.',
  },
  {
    term: 'Thyroid',
    definition:
      'A small gland in the neck that makes hormones, which control how the body uses energy.',
  },
  {
    term: 'Tics',
    definition: 'Sudden movements or sounds that a person can’t easily control.',
  },
  {
    term: 'Tooltip / popover',
    definition: 'A small box of extra information that appears next to an element.',
  },
  {
    term: 'Tourette’s syndrome',
    definition:
      'A condition of the brain and nerves that causes tics, usually starting in childhood.',
  },
  {
    term: 'Transcript',
    definition: 'A written version of everything said, and important sounds, in audio or video.',
  },
  {
    term: 'Tremor',
    definition: 'Shaking that someone can’t control.',
  },
  {
    term: 'Triptans',
    definition: 'Medicines that ease a migraine attack once it’s started.',
  },
  {
    term: 'Tumour',
    definition: 'A lump of cells growing in an uncontrolled way, which may or may not be cancer.',
  },
  {
    term: 'Type 1 diabetes / type 1',
    definition: 'Diabetes where the body can’t make any insulin.',
  },
  {
    term: 'Type 2 diabetes / type 2',
    definition: 'Diabetes where the body doesn’t make enough insulin, or can’t use it well.',
  },
  {
    term: 'Unicode',
    definition: 'The worldwide standard that gives every letter, number, and symbol its own code.',
  },
  {
    term: 'Usability',
    definition: 'How easy something is to use.',
  },
  {
    term: 'User journey',
    definition: 'The steps a person takes to finish a task, such as signing in.',
  },
  {
    term: 'User story / user stories',
    definition: 'A short description of something a user needs to do, used to plan work.',
  },
  {
    term: 'Vestibular disorder',
    definition:
      'An inner-ear condition that affects balance, which movement on screen can make worse.',
  },
  {
    term: 'Voice control',
    definition: 'Controlling a device by speaking commands.',
  },
  {
    term: 'Widget',
    definition: 'A small tool or control added to a web page.',
  },
  {
    term: 'Young-onset dementia / young-onset',
    definition: 'Dementia that starts before the age of 65.',
  },
];
