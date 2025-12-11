export const showBudgetTo = [
  {
    label: 'Everyone',
    value: 'Everyone',
    tooltip: 'Everyone who sees the job can see the price',
  },
  {
    label: 'Selected Talents for Casting',
    value: 'Selected Talents for Casting',
    tooltip: 'Only talents who are selected to come casting can see the price',
  },
  {
    label: 'Selected Talents for Job',
    value: 'Selected Talents for Job',
    tooltip: 'Only talents who are selected for the job can see the price',
  },
  {
    label: 'Nobody',
    value: 'Nobody',
    tooltip: 'No one can see the budget',
  },
];

export const paymentBasis = [
  {
    label: 'On Project',
    value: 'On Project',
    tooltip: 'Fixed amount for entire project',
  },
  {
    label: 'Hourly Rate',
    value: 'Hourly Rate',
    tooltip: 'Paying talent by hourly rate',
  },
];

export const gender = [
  {
    label: 'No Preference',
    value: 'No Preference',
    tooltip: 'No specific gender preference for this role',
  },
  {
    label: 'Male',
    value: 'Male',
    tooltip: 'Specifically looking for male candidates',
  },
  {
    label: 'Female',
    value: 'Female',
    tooltip: 'Specifically looking for female candidates',
  },
  {
    label: 'Non Binary',
    value: 'Non Binary',
    tooltip: 'Open to non-binary candidates',
  },
];

export const activityTypes = [
  {
    label: 'Casting',
    key: 'casting',
    description: 'Casting activity',
  },
  {
    label: 'Fitting',
    key: 'fitting',
    description: 'Fitting activity',
  },
  {
    label: 'Job',
    key: 'job',
    description: 'Job activity',
  },
  {
    label: 'Others',
    key: 'others',
    description: 'Other activity',
  },
];

export const talentCategory = {
  behindTheScenesPersonnel: [
    { key: "director", label: "Director" },
    { key: "producer", label: "Producer" },
    { key: "screenwriter", label: "Screenwriter" },
    { key: "cinematographer", label: "Cinematographer" },
    { key: "editor", label: "Editor" },
    { key: "production_designer", label: "Production Designer" },
    { key: "art_director", label: "Art Director" },
    { key: "costume_designer", label: "Costume Designer" },
    { key: "makeup_artist", label: "Makeup Artist" },
    { key: "hair_stylist", label: "Hair Stylist" },
    { key: "set_designer", label: "Set Designer" },
    { key: "sound_engineer", label: "Sound Engineer" },
    { key: "lighting_technician", label: "Lighting Technician" },
    { key: "casting_director", label: "Casting Director" },
    { key: "visual_effects_artist", label: "Visual Effects Artist" },
    { key: "location_manager", label: "Location Manager" },
    { key: "photographer", label: "Photographer" },
    { key: "marketing_specialist", label: "Marketing Specialist" },
    { key: "social_media_manager", label: "Social Media Manager" },
    { key: "script_supervisor", label: "Script Supervisor" },
    { key: "production_assistant", label: "Production Assistant" },
    { key: "gaffer", label: "Gaffer" },
    { key: "grip", label: "Grip" },
    { key: "sound_mixer", label: "Sound Mixer" },
    { key: "colorist", label: "Colorist" },
    { key: "storyboard_artist", label: "Storyboard Artist" },
    { key: "dolly_grip", label: "Dolly Grip" },
    { key: "post_production_supervisor", label: "Post-Production Supervisor" },
    { key: "transmedia_producer", label: "Transmedia Producer" },
    {
      key: "public_relations_specialist",
      label: "Public Relations Specialist",
    },
    { key: "costume_supervisor", label: "Costume Supervisor" },
    { key: "prop_master", label: "Prop Master" },
    { key: "unit_production_manager", label: "Unit Production Manager" },
    { key: "special_effects_technician", label: "Special Effects Technician" },
    { key: "digital_content_creator", label: "Digital Content Creator" },
    { key: "brand_strategist", label: "Brand Strategist" },
    { key: "consultant", label: "Consultant" },
  ],
  frontOfCameraPersonnel: [
    { key: "models", label: "Models" },
    { key: "actors_actresses", label: "Actors/Actresses" },
    { key: "hosts", label: "Hosts" },
    { key: "dancers", label: "Dancers" },
    { key: "musicians", label: "Musicians" },
    { key: "voice_actors", label: "Voice Actors" },
    { key: "brand_ambassadors", label: "Brand Ambassadors" },
    { key: "influencers", label: "Influencers" },
    { key: "spokespersons", label: "Spokespersons" },
    { key: "reality_tv_stars", label: "Reality TV Stars" },
    { key: "fashion_show_models", label: "Fashion Show Models" },
    { key: "commercial_actors", label: "Commercial Actors" },
    { key: "print_models", label: "Print Models" },
    { key: "lifestyle_models", label: "Lifestyle Models" },
    { key: "fitness_models", label: "Fitness Models" },
    { key: "child_actors_models", label: "Child Actors/Models" },
    { key: "voiceover_artists", label: "Voiceover Artists" },
    { key: "stand_ins", label: "Stand-ins" },
    { key: "background_actors_extras", label: "Background Actors/Extras" },
    { key: "celebrity_guests", label: "Celebrity Guests" },
  ],
}

export const ethnicGroups = [
  {
    category: "African",
    groups: [
      { key: "african", label: "African" },
      { key: "zulu", label: "Zulu (South Africa)" },
      { key: "ashanti", label: "Ashanti (Ghana)" },
      { key: "hausa", label: "Hausa (Nigeria, Niger)" },
      { key: "berbers", label: "Berbers (North Africa)" },
      { key: "amhara", label: "Amhara (Ethiopia)" },
    ],
  },
  {
    category: "Asian",
    groups: [
      { key: "han_chinese", label: "Han Chinese (China)" },
      { key: "japanese", label: "Japanese (Japan)" },
      { key: "koreans", label: "Koreans (North and South Korea)" },
      { key: "indo_aryan", label: "Indo-Aryan (India, Pakistan, Bangladesh)" },
      { key: "turkic", label: "Turkic Peoples (Central Asia, Turkey)" },
      { key: "southeast_asian", label: "Southeast Asian" },
    ],
  },
  {
    category: "European",
    groups: [
      { key: "european", label: "European" },
      { key: "germans", label: "Germans (Germany)" },
      { key: "italians", label: "Italians (Italy)" },
      { key: "slavs", label: "Slavs (Eastern Europe)" },
      { key: "celts", label: "Celts (Ireland, Scotland, Wales)" },
      { key: "basques", label: "Basques (Spain, France)" },
    ],
  },
  {
    category: "Indigenous Peoples",
    groups: [
      { key: "native_americans", label: "Native Americans (United States)" },
      { key: "first_nations", label: "First Nations (Canada)" },
      {
        key: "aboriginal_australians",
        label: "Aboriginal Australians (Australia)",
      },
      { key: "maasai", label: "Maasai (Kenya, Tanzania)" },
      { key: "sami", label: "Sami (Northern Europe)" },
    ],
  },
  {
    category: "Middle Eastern",
    groups: [
      { key: "arabs", label: "Arabs (Middle East and North Africa)" },
      { key: "kurds", label: "Kurds (Iraq, Turkey, Syria, Iran)" },
      { key: "persians", label: "Persians (Iran)" },
      { key: "jews", label: "Jews (Israel, diaspora communities)" },
      { key: "assyrians", label: "Assyrians (Iraq, Syria)" },
    ],
  },
  {
    category: "Pacific Islanders",
    groups: [
      { key: "polynesians", label: "Polynesians (Hawaii, Samoa, Tonga)" },
      { key: "melanesians", label: "Melanesians (Fiji, Papua New Guinea)" },
      { key: "micronesians", label: "Micronesians (Guam, Palau)" },
    ],
  },
  {
    category: "Latin American",
    groups: [
      {
        key: "mestizos",
        label: "Mestizos (mixed European and Indigenous ancestry)",
      },
      {
        key: "indigenous_latin_american",
        label: "Indigenous Peoples (various groups across Latin America)",
      },
      {
        key: "afro_latinos",
        label: "Afro-Latinos (people of African descent in Latin America)",
      },
    ],
  },
]