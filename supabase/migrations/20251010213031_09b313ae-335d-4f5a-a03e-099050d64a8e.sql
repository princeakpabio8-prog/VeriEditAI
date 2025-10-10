-- Insert 20 high-value organizations for VeriEdit partnerships

-- Nigerian Organizations
INSERT INTO organizations (name, domain, website, industry, description, contact_email, verified_partner)
VALUES 
  ('Dubawa', 'dubawa.org', 'https://dubawa.org', 'Fact-Checking', 
   'West Africa''s first independent fact-checking organization, focused on debunking false claims and misinformation in Nigerian media and politics.', 
   'info@dubawa.org', false),
   
  ('Africa Check Nigeria', 'africacheck.org', 'https://africacheck.org/nigeria', 'Fact-Checking',
   'Africa''s first independent fact-checking organization with a dedicated Nigeria bureau, verifying claims made in public discourse.',
   'nigeria@africacheck.org', false),
   
  ('National Broadcasting Commission', 'nbc.gov.ng', 'https://nbc.gov.ng', 'Governance',
   'Nigeria''s broadcast regulatory authority responsible for monitoring and sanctioning broadcasters for false information and hate speech.',
   'info@nbc.gov.ng', false),
   
  ('Independent National Electoral Commission', 'inecnigeria.org', 'https://www.inecnigeria.org', 'Governance',
   'Nigeria''s electoral body that battles misinformation around elections, voter registration, and election results.',
   'info@inecnigeria.org', false),
   
  ('Central Bank of Nigeria', 'cbn.gov.ng', 'https://www.cbn.gov.ng', 'Finance',
   'Nigeria''s central bank frequently combats financial misinformation, currency manipulation claims, and fake economic policies.',
   'contactcenter@cbn.gov.ng', false),
   
  ('Premium Times Centre for Investigative Journalism', 'ptcij.org', 'https://www.ptcij.org', 'Media',
   'Leading Nigerian investigative journalism center with a dedicated fact-checking initiative called FactCheckHub.',
   'info@ptcij.org', false),
   
  ('Nigeria Centre for Disease Control', 'ncdc.gov.ng', 'https://ncdc.gov.ng', 'Health',
   'Nigeria''s national public health institute that combats health misinformation, especially during disease outbreaks and vaccination campaigns.',
   'info@ncdc.gov.ng', false),

-- Global Fact-Checking Organizations
  ('International Fact-Checking Network', 'ifcncodeofprinciples.poynter.org', 'https://www.poynter.org/ifcn', 'Fact-Checking',
   'Global network of fact-checkers committed to promoting excellence in fact-checking worldwide, housed at the Poynter Institute.',
   'ifcn@poynter.org', false),
   
  ('Full Fact', 'fullfact.org', 'https://fullfact.org', 'Fact-Checking',
   'UK''s independent fact-checking charity, pioneering automated fact-checking technology and tools.',
   'team@fullfact.org', false),
   
  ('European Fact-Checking Standards Network', 'efcsn.com', 'https://www.efcsn.com', 'Fact-Checking',
   'Network ensuring high standards of fact-checking across European Union member states.',
   'contact@efcsn.com', false),
   
  ('Snopes', 'snopes.com', 'https://www.snopes.com', 'Fact-Checking',
   'Oldest and most well-known fact-checking website, investigating rumors, urban legends, and misinformation since 1994.',
   'inquiries@snopes.com', false),

-- UN & International Bodies
  ('UNESCO', 'unesco.org', 'https://www.unesco.org', 'International Organizations',
   'United Nations agency promoting media literacy and fighting disinformation through its Media and Information Literacy programs.',
   'bpi@unesco.org', false),
   
  ('WHO AIRA', 'who.int', 'https://www.who.int/initiatives/epi-brain', 'Health',
   'World Health Organization''s initiative to combat health misinformation using AI and provide verified health information.',
   'info@who.int', false),
   
  ('UN Global Pulse', 'unglobalpulse.org', 'https://www.unglobalpulse.org', 'International Organizations',
   'UN''s innovation initiative using big data and AI to detect and analyze misinformation patterns affecting vulnerable populations.',
   'info@unglobalpulse.org', false),

-- Academic & Research Institutions
  ('Oxford Centre for Social Studies', 'ox.ac.uk', 'https://www.oii.ox.ac.uk', 'Education',
   'Oxford University''s research center studying misinformation, computational propaganda, and digital verification methods.',
   'enquiries@oii.ox.ac.uk', false),
   
  ('Reuters Institute for the Study of Journalism', 'reutersinstitute.politics.ox.ac.uk', 'https://reutersinstitute.politics.ox.ac.uk', 'Education',
   'Leading research institute studying journalism, digital news, and misinformation trends globally.',
   'reuters.institute@politics.ox.ac.uk', false),

-- Tech Platforms
  ('Meta Third-Party Fact-Checking Program', 'facebook.com', 'https://www.facebook.com/formedia/mjp/programs/third-party-fact-checking', 'Technology',
   'Meta''s global program partnering with independent fact-checkers to review and rate content on Facebook and Instagram.',
   'factcheck@fb.com', false),
   
  ('Google News Initiative', 'newsinitiative.withgoogle.com', 'https://newsinitiative.withgoogle.com', 'Technology',
   'Google''s initiative supporting journalism and fighting misinformation through tools, training, and funding for fact-checkers.',
   'news-initiative@google.com', false),

-- Political & Regional Organizations
  ('African Union', 'au.int', 'https://au.int', 'International Organizations',
   'Continental body combating misinformation affecting African politics, security, and development initiatives.',
   'sitrc@africa-union.org', false),
   
  ('ECOWAS', 'ecowas.int', 'https://www.ecowas.int', 'International Organizations',
   'Regional organization fighting misinformation that threatens regional stability, elections, and economic integration in West Africa.',
   'info@ecowas.int', false)

ON CONFLICT (domain) DO NOTHING;