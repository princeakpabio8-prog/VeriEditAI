-- Backfill source regions for existing NULL values
UPDATE sources 
SET source_region = 'North America'
WHERE source_region IS NULL 
AND (
  domain LIKE '%.com' OR domain LIKE '%.us' OR domain LIKE '%.ca'
  OR domain IN (
    'www.reuters.com', 'www.nytimes.com', 'www.cnn.com', 
    'edition.cnn.com', 'us.cnn.com', 'amp.cnn.com',
    'www.npr.org', 'apnews.com', 'www.politifact.com',
    'archive.nytimes.com', 'nytco-assets.nytimes.com',
    'newslink.reuters.com', 'reuters.com', 'nytimes.com', 'cnn.com',
    'npr.org', 'washingtonpost.com', 'foxnews.com', 'nbcnews.com',
    'abcnews.go.com', 'cbsnews.com', 'usatoday.com', 'wsj.com',
    'politico.com', 'thehill.com', 'latimes.com', 'nypost.com',
    'newsweek.com', 'time.com', 'fortune.com', 'bloomberg.com',
    'cnbc.com', 'forbes.com', 'businessinsider.com', 'huffpost.com',
    'vox.com', 'slate.com', 'salon.com', 'theatlantic.com',
    'newyorker.com', 'propublica.org', 'factcheck.org', 'politifact.com',
    'snopes.com', 'truthorfiction.com', 'cbc.ca', 'globalnews.ca'
  )
);

-- Europe
UPDATE sources 
SET source_region = 'Europe'
WHERE source_region IS NULL 
AND (
  domain LIKE '%.uk' OR domain LIKE '%.eu' OR domain LIKE '%.de' OR domain LIKE '%.fr'
  OR domain LIKE '%.es' OR domain LIKE '%.it' OR domain LIKE '%.nl' OR domain LIKE '%.se'
  OR domain LIKE '%.no' OR domain LIKE '%.dk' OR domain LIKE '%.fi' OR domain LIKE '%.ie'
  OR domain IN (
    'www.bbc.com', 'www.theguardian.com', 'bbc.com', 'bbc.co.uk',
    'theguardian.com', 'independent.co.uk', 'telegraph.co.uk',
    'dailymail.co.uk', 'thetimes.co.uk', 'ft.com', 'economist.com',
    'euronews.com', 'dw.com', 'france24.com', 'rfi.fr', 'lemonde.fr',
    'lefigaro.fr', 'spiegel.de', 'zeit.de', 'elpais.com', 'elmundo.es',
    'corriere.it', 'repubblica.it', 'ansa.it', 'rtve.es', 'rte.ie',
    'thejournal.ie', 'nos.nl', 'svt.se', 'dr.dk', 'nrk.no'
  )
);

-- Africa
UPDATE sources 
SET source_region = 'Africa'
WHERE source_region IS NULL 
AND (
  domain LIKE '%.ng' OR domain LIKE '%.za' OR domain LIKE '%.ke'
  OR domain LIKE '%.gh' OR domain LIKE '%.tz' OR domain LIKE '%.ug'
  OR domain LIKE '%.et' OR domain LIKE '%.eg'
  OR domain IN (
    'cdn.businessday.ng', 'www.completesports.com', 'businessday.ng',
    'completesports.com', 'premiumtimesng.com', 'punchng.com',
    'vanguardngr.com', 'thenationonlineng.net', 'dailytrust.com.ng',
    'guardian.ng', 'news24.com', 'iol.co.za', 'timeslive.co.za',
    'mg.co.za', 'dailymaverick.co.za', 'nation.co.ke', 'standardmedia.co.ke',
    'businessdailyafrica.com', 'theeastafrican.co.ke', 'africanews.com'
  )
);

-- Asia Pacific
UPDATE sources 
SET source_region = 'Asia Pacific'
WHERE source_region IS NULL 
AND (
  domain LIKE '%.jp' OR domain LIKE '%.cn' OR domain LIKE '%.au'
  OR domain LIKE '%.in' OR domain LIKE '%.sg' OR domain LIKE '%.kr'
  OR domain LIKE '%.th' OR domain LIKE '%.my' OR domain LIKE '%.nz'
  OR domain LIKE '%.ph' OR domain LIKE '%.vn' OR domain LIKE '%.id'
  OR domain IN (
    'scmp.com', 'straitstimes.com', 'channelnewsasia.com',
    'japantimes.co.jp', 'asahi.com', 'mainichi.jp', 'yomiuri.co.jp',
    'thehindu.com', 'hindustantimes.com', 'indianexpress.com',
    'timesofindia.com', 'dawn.com', 'thenews.com.pk', 'smh.com.au',
    'abc.net.au', 'news.com.au', 'nzherald.co.nz', 'stuff.co.nz',
    'bangkokpost.com', 'nationthailand.com', 'todayonline.com',
    'koreaherald.com', 'koreatimes.co.kr'
  )
);

-- Latin America
UPDATE sources 
SET source_region = 'Latin America'
WHERE source_region IS NULL 
AND (
  domain LIKE '%.br' OR domain LIKE '%.mx' OR domain LIKE '%.ar'
  OR domain LIKE '%.cl' OR domain LIKE '%.co' OR domain LIKE '%.pe'
  OR domain LIKE '%.ve' OR domain LIKE '%.uy'
  OR domain IN (
    'folha.uol.com.br', 'globo.com', 'estadao.com.br', 'uol.com.br',
    'clarin.com', 'lanacion.com.ar', 'pagina12.com.ar', 'infobae.com',
    'eluniversal.com.mx', 'reforma.com', 'jornada.com.mx', 'milenio.com',
    'eltiempo.com', 'semana.com', 'elespectador.com', 'latercera.com',
    'emol.com', 'elmercurio.com', 'elpais.com.uy', 'elobservador.com.uy'
  )
);

-- Middle East
UPDATE sources 
SET source_region = 'Middle East'
WHERE source_region IS NULL 
AND (
  domain LIKE '%.ae' OR domain LIKE '%.sa' OR domain LIKE '%.il'
  OR domain LIKE '%.qa' OR domain LIKE '%.kw' OR domain LIKE '%.tr'
  OR domain IN (
    'alarabiya.net', 'aljazeera.net', 'arabnews.com', 'gulfnews.com',
    'khaleejtimes.com', 'thenational.ae', 'gulf-times.com', 'dohanews.co',
    'haaretz.com', 'timesofisrael.com', 'jpost.com', 'ynetnews.com',
    'turkishminute.com', 'hurriyetdailynews.com', 'dailysabah.com'
  )
);

-- Default remaining to International (truly global/unknown)
UPDATE sources 
SET source_region = 'International'
WHERE source_region IS NULL;