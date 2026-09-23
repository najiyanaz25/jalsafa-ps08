/* MediFind - four-dashboard prototype enhancements
   - Persistent language switching (English / Malayalam / Hindi)
   - Browser live-location permission
   - Distance calculation (Haversine)
   - Interactive Leaflet/OpenStreetMap maps
   - Medicine search summary: in stock / low stock / depleted
   - Working Map / Call / Directions actions for every facility
*/

const facilities = [
  {name:"Central District General Hospital Pharmacy",type:"DISTRICT GENERAL HOSPITAL",address:"100 Medical Centre Boulevard, Central District",hours:"24/7 Dispensary (Emergency & Inpatient / Outpatient 8am–8pm)",phone:"+1 (555) 019-2831",stock:100,inStock:28,low:0,out:0,color:"red",lat:9.9816,lng:76.2999},
  {name:"Eastside Government Polyclinic",type:"URBAN POLYCLINIC",address:"73 Sunbird Crescent, East District",hours:"Mon–Fri: 8:00 AM–6:00 PM, Sat: 8:00 AM–2:00 PM",phone:"+1 (555) 019-7311",stock:96,inStock:27,low:1,out:0,color:"teal",lat:9.9921,lng:76.3055},
  {name:"Greenfield Urban Health Dispensary",type:"PRIMARY HEALTH POST",address:"18 Botanical Gardens Way, Greenfield",hours:"Mon–Fri: 8:30 AM–5:00 PM",phone:"+1 (555) 019-1498",stock:46,inStock:13,low:15,out:0,color:"purple",lat:9.9702,lng:76.2872},
  {name:"Metro Polyclinic & Public Dispensary",type:"URBAN POLYCLINIC",address:"Metro District, Downtown North",hours:"Mon–Fri: 8:00 AM–6:00 PM",phone:"+1 (555) 019-2201",stock:88,inStock:24,low:3,out:1,color:"teal",lat:9.9975,lng:76.2924},
  {name:"North Sub-District Public Health Centre",type:"SUB-DISTRICT HEALTH CENTRE",address:"North Valley, North District",hours:"Mon–Fri: 8:00 AM–5:00 PM",phone:"+1 (555) 019-2214",stock:91,inStock:25,low:2,out:1,color:"teal",lat:10.0094,lng:76.3032},
  {name:"Victoria Memorial District Hospital",type:"DISTRICT GENERAL HOSPITAL",address:"South District, Victoria Road",hours:"24/7 Dispensary",phone:"+1 (555) 019-8302",stock:79,inStock:21,low:6,out:1,color:"red",lat:9.9631,lng:76.3006},
  {name:"Westside Community Health Centre",type:"COMMUNITY HEALTH CENTRE",address:"West Market, West District",hours:"Mon–Fri: 8:30 AM–4:30 PM",phone:"+1 (555) 019-7772",stock:84,inStock:23,low:4,out:1,color:"teal",lat:9.9845,lng:76.2731},
  {name:"Riverside Primary Health Post & Clinic",type:"PRIMARY HEALTH POST",address:"Riverside Sector, East District",hours:"Mon–Fri: 8:30 AM–5:00 PM",phone:"+1 (555) 019-1490",stock:72,inStock:20,low:7,out:1,color:"purple",lat:9.9744,lng:76.3154}
];

const equivalents = [
  ["Norvasc 5mg","Amlodipine 5mg (Generic)","Cardiovascular / Hypertension","58 Centres in Stock"],
  ["Amlodipine 5mg","Amlodipine 5mg (Generic)","Cardiovascular / Hypertension","58 Centres in Stock"],
  ["Augmentin 625mg","Amoxicillin + Clavulanate 625mg (Generic)","Antibiotic / Anti-infective","61 Centres in Stock"],
  ["Zithromax 500mg","Azithromycin 500mg (Generic)","Antibiotic / Anti-infective","45 Centres in Stock"],
  ["Brufen 400mg","Ibuprofen 400mg (Generic)","Analgesic / Anti-inflammatory","54 Centres in Stock"],
  ["Co-Diovan 160/12.5mg","Valsartan 160mg (Generic)","Cardiovascular / Hypertension","42 Centres in Stock"],
  ["Glucophage 500mg","Metformin HCl 500mg (Generic)","Endocrine / Diabetes","71 Centres in Stock"],
  ["Losec 20mg","Omeprazole 20mg (Generic)","Gastrointestinal","78 Centres in Stock"],
  ["Panadol 500mg","Paracetamol 500mg (Generic)","Analgesic / Antipyretic","79 Centres in Stock"],
  ["Ventolin Inhaler 100mcg","Salbutamol Inhaler 100mcg (Generic)","Respiratory","64 Centres in Stock"]
];

const audit = facilities.map((f,i)=>({f:f.name,d:i%2?"North Valley":"Central Metro",last:i%3===0?"4 hours ago":"1 hour ago",fresh:"Fresh",score:f.stock}));

// Medicine-specific demo availability. Values are facility counts, not medicine quantities.
const medicineProfiles = {
  amlodipine:{inStock:5,low:2,out:1},
  metformin:{inStock:6,low:1,out:1},
  paracetamol:{inStock:7,low:1,out:0},
  amoxicillin:{inStock:6,low:1,out:1},
  clavulanate:{inStock:6,low:1,out:1},
  azithromycin:{inStock:5,low:2,out:1},
  ibuprofen:{inStock:6,low:2,out:0},
  valsartan:{inStock:5,low:2,out:1},
  omeprazole:{inStock:7,low:1,out:0},
  salbutamol:{inStock:6,low:1,out:1}
};

let currentLanguage = localStorage.getItem("medifindLanguage") || "en";
let userLocation = null;
let mainMap = null;
let facilitiesMap = null;
let locationMarker = null;
let mapMarkers = [];
let searchTimer = null;

const translations = {
  en:{
    demoBadge:"▣ DEMO DATA", demoNoticeStrong:"Notice for Hackathon Evaluators:", demoNotice:"All facility stock levels, batch numbers, and verification timestamps are simulated realistic demonstration data. This portal does not connect to live national health databases.", clinicalActive:"◉ Clinical Advisory Active　×", brandSub:"Government Pharmacy Tracker", navFind:"Find Medicine", navFacilities:"Facilities", navEquiv:"Generic Equivalents", navHealth:"Data Health", checkStock:"Check Stock",
    findLabel:"Government Medicine Availability", findTitle:"Find medicine before you travel.", findSub:"Search verified government dispensary stock, compare nearby facilities, and check when the data was last updated.", medicine:"Medicine", searchPlaceholder:"e.g. Amlodipine 5mg", search:"Search", searchResults:"SEARCH RESULTS", searchResultsSub:"Government facilities with simulated current availability.", updated:"● Updated 4 hours ago", nearbyNetwork:"NEARBY GOVERNMENT NETWORK", networkTitle:"Check stock across the network", networkSub:"Browse the sample Metro District network before travelling.", viewFacilities:"View all facilities →", locationView:"LOCATION VIEW", mapTitle:"Nearby stock at a glance", mapSub:"Live location is used only in your browser to calculate distance to the demo facility coordinates.", safetyTitle:"Healthcare Safety Notice:", safetyBody:"MediFind is a stock availability directory, not a prescribing service.", safetyStrong:"Never substitute medications without consulting your pharmacist or clinician.", emergencyTitle:"Medical Emergency?", emergencyBody:"Do not use this portal — call emergency services immediately.", emergency:"Emergency", healthline:"Healthline", publicHealth:"PUBLIC HEALTH INITIATIVE", footerDesc:"Reducing wasted patient travel across government clinics, polyclinics, and hospital dispensaries. Providing verified stock availability, generic bioequivalents, and data freshness indicators for the public.", builtWith:"◈ Hackathon Prototype · Built with HTML, CSS & JavaScript", coreModules:"CORE MODULES", moduleSearch:"Medicine Search", moduleFacilities:"Facilities Directory", moduleEquiv:"Generic Equivalents", moduleHealth:"Data Health Monitor", healthSafety:"HEALTH & SAFETY", healthSafetyText:"This tool is for availability discovery only. Never substitute medications without consulting a licensed pharmacist or prescribing clinician.", simulatedActive:"● Simulated Demo Data Active", footerLinks:"Privacy Policy　 Clinical Standards　 Open Data API",
    facilityNetwork:"GOVERNMENT DISPENSARY NETWORK", facilityTitle:"Health Facilities Directory", facilityLead:"Browse all 8 government health centres in the Metro District network. Each facility shows current dispensary stock rates, operating hours, and data freshness.", chipHospitals:"2 General Hospitals", chipPolyclinics:"2 Polyclinics", chipCommunity:"1 Community Centres", chipPosts:"2 Health Posts", facilityMapTitle:"All facilities on the map", facilityMapSub:"Allow location access to calculate your distance from each demo facility.", facilitySafety:"Facility availability is simulated for the hackathon prototype. Verify stock directly before travelling.",
    equivDirectory:"⌕ NATIONAL FORMULARY EQUIVALENCE DIRECTORY", equivTitle:"Generic & Bioequivalent Medicines", equivLead:"Discover verified bioequivalent alternatives for prescribed brand medicines. When a specific proprietary brand is out of stock at your nearest health post, government dispensaries often maintain abundant generic formulations with identical active ingredients.", crucialNotice:"Crucial Healthcare Safety Notice: Informational Only", equivNotice:"MediFind never instructs users to substitute medications. Generic equivalents listed here are strictly informational based on World Health Organization (WHO) International Non-proprietary Names (INN) and Ministry of Health formulary guidelines.", verifySub:"✓ Always verify any brand substitution with your pharmacist or prescribing clinician before dispensing.", innTitle:"What is INN Generic?", innText:"The International Non-proprietary Name (INN) identifies the active chemical pharmaceutical ingredient. A generic medicine contains the exact same active substance in the same strength as the brand version.", bioTitle:"Proven Bioequivalence", bioText:"Generic formulations undergo strict clinical dissolution testing to prove they deliver the same rate and extent of therapeutic drug absorption into the body as the originator brand.", abundanceTitle:"Public Dispensary Abundance", abundanceText:"Government health centres prioritize generic purchasing to ensure affordable public access. When brand stocks run low, generic stock is typically replenished first.", formularyTitle:"Formulary Equivalents", patientSafetyTitle:"Patient Safety & Medical Disclaimer", publicHealthGuidance:"PUBLIC HEALTH GUIDANCE", psGuidance:"MediFind provides medicine availability estimates across public health dispensaries to minimize travel time for patients.", psNot:"This tool does not diagnose, prescribe, or dispense medications.", psGenericTitle:"A Generic Substitution:", psGeneric:"Bioequivalents listed are informational only based on WHO INN standards. Always verify with your pharmacist before any substitution.", psCallTitle:"Call Before Travelling:", psCall:"If data is >24h old or medicine is critical, call the dispensary counter directly to confirm current stock.", psEmergencyQ:"Medical Emergency?", psEmergency:"Do not use this portal - call emergency services immediately.", clinicalGuidance:"Clinical Formulation Guidance:", clinicalGuidanceText:"Check the active ingredient, strength, and dosage form with a licensed pharmacist or clinician. This page is informational only.",
    healthMonitor:"⌁ OPERATIONAL HEALTH & AUDIT MONITOR", healthTitle:"Data Freshness & Stock Simulator", healthLead:"Monitor dispensary data reporting compliance, inspect stale vs. fresh inventory records, and use the interactive stock update simulator to test real-time state changes.", refreshHealth:"⟳ Refresh Health Stats", viewPublic:"View Public Search", simTitle:"Interactive Stock Simulator (Hackathon Demo Tool)", simLead:"Select any government health facility and essential medicine to update its availability. Watch the last-updated timestamp refresh and see results reflect immediately on the Search and Facility pages.", liveWrite:"Live Database Write", simulatorTitle:"▣ Dispensary Stock Update Simulator", simulatorSub:"Simulate real-time dispensary stock adjustments to demonstrate immediate UI updates", selectFacility:"Select Government Facility", selectMedicine:"Select Essential Medicine", newStatus:"New Stock Status to Set", inStock:"IN STOCK", lowStock:"LOW STOCK", outStock:"OUT OF STOCK", auditReason:"Audit Reason", verifier:"Verifier & License #", publishUpdate:"Publish Stock Update", auditTitle:"Government Facility Reporting Audit", statCompliance:"Reporting Compliance", statFresh:"Fresh Data (hours)", statReporting:"Facilities Reporting", statStale:"Stale / Needs Review", thFacility:"FACILITY", thDistrict:"DISTRICT", thAudit:"LAST STOCK AUDIT", thFreshness:"FRESHNESS", thScore:"COMPLIANCE SCORE",
    inStockLabel:"In Stock", lowLabel:"Low Stock", outLabel:"Depleted", totalLabel:"Total Facilities", distance:"Distance", map:"Map", directions:"Directions", call:"Call", viewCatalog:"View Catalog →", formulary:"Formulary Availability", updatedShort:"Updated 4 hours ago", centresInStock:"Centres in Stock", genericBio:"GENERIC BIOEQUIVALENT", activeIngredient:"active ingredient", verifyWithPharmacist:"Verify strength, dosage form, and active ingredient with your pharmacist.", locateMe:"Use Live Location", locating:"Locating…", locationReady:"Live location enabled", locationDenied:"Location permission was denied. Distances are unavailable.", distanceUnavailable:"Distance unavailable", demoCoords:"Demo facility coordinates"
  },
  ml:{
    demoBadge:"▣ ഡെമോ ഡാറ്റ", demoNoticeStrong:"ഹാക്കത്തോൺ വിലയിരുത്തുന്നവർക്കുള്ള അറിയിപ്പ്:", demoNotice:"എല്ലാ കേന്ദ്രങ്ങളുടെയും സ്റ്റോക്ക് നില, ബാച്ച് നമ്പറുകൾ, പരിശോധന സമയങ്ങൾ എന്നിവ യാഥാർത്ഥ്യസദൃശമായ ഡെമോ ഡാറ്റയാണ്. ഈ പോർട്ടൽ ലൈവ് ദേശീയ ആരോഗ്യ ഡാറ്റാബേസുമായി ബന്ധിപ്പിച്ചിട്ടില്ല.", clinicalActive:"◉ ക്ലിനിക്കൽ അഡ്വൈസറി സജീവം　×", brandSub:"സർക്കാർ ഫാർമസി ട്രാക്കർ", navFind:"മരുന്ന് കണ്ടെത്തുക", navFacilities:"കേന്ദ്രങ്ങൾ", navEquiv:"ജനറിക് സമാനമരുന്നുകൾ", navHealth:"ഡാറ്റ ആരോഗ്യനില", checkStock:"സ്റ്റോക്ക് പരിശോധിക്കുക",
    findLabel:"സർക്കാർ മരുന്ന് ലഭ്യത", findTitle:"യാത്രയ്ക്കുമുമ്പ് മരുന്ന് കണ്ടെത്തൂ.", findSub:"സർക്കാർ ഡിസ്പെൻസറി സ്റ്റോക്ക് പരിശോധിക്കുക, സമീപ കേന്ദ്രങ്ങൾ താരതമ്യം ചെയ്യുക, ഡാറ്റ അവസാനമായി പുതുക്കിയത് പരിശോധിക്കുക.", medicine:"മരുന്ന്", searchPlaceholder:"ഉദാ. Amlodipine 5mg", search:"തിരയുക", searchResults:"തിരച്ചിൽ ഫലങ്ങൾ", searchResultsSub:"സിമുലേറ്റ് ചെയ്ത നിലവിലെ ലഭ്യതയുള്ള സർക്കാർ കേന്ദ്രങ്ങൾ.", updated:"● 4 മണിക്കൂർ മുമ്പ് പുതുക്കി", nearbyNetwork:"സമീപ സർക്കാർ ശൃംഖല", networkTitle:"ശൃംഖലയിൽ സ്റ്റോക്ക് പരിശോധിക്കുക", networkSub:"യാത്രയ്ക്കുമുമ്പ് മാതൃകാ Metro District ശൃംഖല പരിശോധിക്കുക.", viewFacilities:"എല്ലാ കേന്ദ്രങ്ങളും കാണുക →", locationView:"ലൊക്കേഷൻ കാഴ്ച", mapTitle:"സമീപ സ്റ്റോക്ക് ഒറ്റനോട്ടത്തിൽ", mapSub:"ഡെമോ കേന്ദ്രങ്ങളിലേക്കുള്ള ദൂരം കണക്കാക്കാൻ ബ്രൗസറിലെ ലൈവ് ലൊക്കേഷൻ മാത്രം ഉപയോഗിക്കുന്നു.", safetyTitle:"ആരോഗ്യ സുരക്ഷാ അറിയിപ്പ്:", safetyBody:"MediFind ഒരു സ്റ്റോക്ക് ലഭ്യത ഡയറക്ടറിയാണ്; ഇത് മരുന്ന് നിർദ്ദേശിക്കുന്ന സേവനം അല്ല.", safetyStrong:"ഫാർമസിസ്റ്റിനെയോ ഡോക്ടറെയോ സമീപിക്കാതെ മരുന്ന് മാറ്റി ഉപയോഗിക്കരുത്.", emergencyTitle:"മെഡിക്കൽ അടിയന്തരാവസ്ഥ?", emergencyBody:"ഈ പോർട്ടൽ ഉപയോഗിക്കരുത് — ഉടൻ അടിയന്തര സേവനങ്ങളെ വിളിക്കുക.", emergency:"അടിയന്തര സേവനം", healthline:"ഹെൽത്ത്‌ലൈൻ", publicHealth:"പൊതു ആരോഗ്യ സംരംഭം", footerDesc:"സർക്കാർ ക്ലിനിക്കുകൾ, പോളിക്ലിനിക്കുകൾ, ആശുപത്രി ഡിസ്പെൻസറികൾ എന്നിവിടങ്ങളിലേക്കുള്ള അനാവശ്യ രോഗി യാത്ര കുറയ്ക്കുന്നു. പൊതുജനങ്ങൾക്ക് സ്റ്റോക്ക് ലഭ്യത, ജനറിക് സമാനമരുന്നുകൾ, ഡാറ്റ പുതുക്കൽ സൂചകങ്ങൾ നൽകുന്നു.", builtWith:"◈ ഹാക്കത്തോൺ പ്രോട്ടോടൈപ്പ് · HTML, CSS & JavaScript ഉപയോഗിച്ച്", coreModules:"പ്രധാന മോഡ്യൂളുകൾ", moduleSearch:"മരുന്ന് തിരച്ചിൽ", moduleFacilities:"കേന്ദ്ര ഡയറക്ടറി", moduleEquiv:"ജനറിക് സമാനമരുന്നുകൾ", moduleHealth:"ഡാറ്റ ആരോഗ്യനില നിരീക്ഷണം", healthSafety:"ആരോഗ്യവും സുരക്ഷയും", healthSafetyText:"ഇത് മരുന്ന് ലഭ്യത കണ്ടെത്തുന്നതിനുള്ള ഉപകരണം മാത്രമാണ്. ലൈസൻസുള്ള ഫാർമസിസ്റ്റിനെയോ ഡോക്ടറെയോ സമീപിക്കാതെ മരുന്ന് മാറ്റി ഉപയോഗിക്കരുത്.", simulatedActive:"● സിമുലേറ്റഡ് ഡെമോ ഡാറ്റ സജീവം", footerLinks:"സ്വകാര്യതാ നയം　 ക്ലിനിക്കൽ മാനദണ്ഡങ്ങൾ　 ഓപ്പൺ ഡാറ്റ API",
    facilityNetwork:"സർക്കാർ ഡിസ്പെൻസറി ശൃംഖല", facilityTitle:"ആരോഗ്യ കേന്ദ്ര ഡയറക്ടറി", facilityLead:"Metro District ശൃംഖലയിലെ 8 സർക്കാർ ആരോഗ്യ കേന്ദ്രങ്ങൾ കാണുക. ഓരോ കേന്ദ്രവും സ്റ്റോക്ക് നിരക്ക്, പ്രവർത്തന സമയം, ഡാറ്റ പുതുക്കൽ നില എന്നിവ കാണിക്കുന്നു.", chipHospitals:"2 ജനറൽ ആശുപത്രികൾ", chipPolyclinics:"2 പോളിക്ലിനിക്കുകൾ", chipCommunity:"1 കമ്മ്യൂണിറ്റി കേന്ദ്രം", chipPosts:"2 ഹെൽത്ത് പോസ്റ്റുകൾ", facilityMapTitle:"എല്ലാ കേന്ദ്രങ്ങളും മാപ്പിൽ", facilityMapSub:"ഓരോ ഡെമോ കേന്ദ്രത്തിലേക്കുള്ള ദൂരം കണക്കാക്കാൻ ലൊക്കേഷൻ അനുവദിക്കുക.", facilitySafety:"ഈ ഹാക്കത്തോൺ പ്രോട്ടോടൈപ്പിലെ കേന്ദ്ര ലഭ്യത സിമുലേറ്റ് ചെയ്തതാണ്. യാത്രയ്ക്കുമുമ്പ് സ്റ്റോക്ക് നേരിട്ട് സ്ഥിരീകരിക്കുക.",
    equivDirectory:"⌕ ദേശീയ ഫോർമുലറി സമാനത ഡയറക്ടറി", equivTitle:"ജനറിക് & ബയോഇക്വിവലന്റ് മരുന്നുകൾ", equivLead:"നിർദ്ദേശിച്ച ബ്രാൻഡ് മരുന്നുകൾക്ക് ബയോഇക്വിവലന്റ് പകരക്കാരെ കണ്ടെത്തുക. സമീപത്തെ ആരോഗ്യകേന്ദ്രത്തിൽ ഒരു ബ്രാൻഡ് ലഭ്യമല്ലെങ്കിൽ, സർക്കാർ ഡിസ്പെൻസറികളിൽ സമാന സജീവ ഘടകങ്ങളുള്ള ജനറിക് രൂപങ്ങൾ ലഭ്യമായിരിക്കാം.", crucialNotice:"പ്രധാന ആരോഗ്യ സുരക്ഷാ അറിയിപ്പ്: വിവരത്തിനായി മാത്രം", equivNotice:"MediFind മരുന്ന് മാറ്റി ഉപയോഗിക്കാൻ നിർദ്ദേശിക്കുന്നില്ല. ഇവിടെ നൽകിയ ജനറിക് സമാനമരുന്നുകൾ WHO International Non-proprietary Names (INN), ആരോഗ്യ മന്ത്രാലയ ഫോർമുലറി മാർഗ്ഗനിർദ്ദേശങ്ങൾ എന്നിവയെ അടിസ്ഥാനമാക്കിയുള്ള വിവരങ്ങൾ മാത്രമാണ്.", verifySub:"✓ വിതരണം ചെയ്യുന്നതിന് മുമ്പ് ഏതൊരു ബ്രാൻഡ് മാറ്റവും ഫാർമസിസ്റ്റിനോടോ നിർദ്ദേശിക്കുന്ന ഡോക്ടറോടോ സ്ഥിരീകരിക്കുക.", innTitle:"INN ജനറിക് എന്താണ്?", innText:"International Non-proprietary Name (INN) സജീവ ഔഷധ ഘടകത്തെ തിരിച്ചറിയുന്നു. ജനറിക് മരുന്നിൽ ബ്രാൻഡ് പതിപ്പിലുള്ള അതേ സജീവ ഘടകം അതേ ശക്തിയിൽ അടങ്ങിയിരിക്കും.", bioTitle:"സ്ഥിരീകരിച്ച ബയോഇക്വിവലൻസ്", bioText:"ജനറിക് രൂപങ്ങൾ ബ്രാൻഡ് മരുന്നിനോട് സമാനമായ ആഗിരണ നിരക്കും അളവും നൽകുന്നുവെന്ന് തെളിയിക്കാൻ കർശന പരിശോധനകൾക്ക് വിധേയമാകുന്നു.", abundanceTitle:"പൊതു ഡിസ്പെൻസറി ലഭ്യത", abundanceText:"കുറഞ്ഞ ചെലവിൽ പൊതുജനങ്ങൾക്ക് മരുന്ന് ലഭ്യമാക്കാൻ സർക്കാർ കേന്ദ്രങ്ങൾ ജനറിക് വാങ്ങലിന് മുൻഗണന നൽകുന്നു.", formularyTitle:"ഫോർമുലറി സമാനമരുന്നുകൾ", patientSafetyTitle:"രോഗി സുരക്ഷയും മെഡിക്കൽ നിരാകരണവും", publicHealthGuidance:"പൊതു ആരോഗ്യ മാർഗ്ഗനിർദ്ദേശം", psGuidance:"രോഗികളുടെ യാത്രാസമയം കുറയ്ക്കാൻ പൊതു ആരോഗ്യ ഡിസ്പെൻസറികളിലെ മരുന്ന് ലഭ്യതയുടെ കണക്കുകൾ MediFind നൽകുന്നു.", psNot:"ഈ ഉപകരണം രോഗനിർണയം ചെയ്യുകയോ മരുന്ന് നിർദ്ദേശിക്കുകയോ വിതരണം ചെയ്യുകയോ ചെയ്യുന്നില്ല.", psGenericTitle:"ജനറിക് മാറ്റിസ്ഥാപിക്കൽ:", psGeneric:"ലിസ്റ്റ് ചെയ്ത ബയോഇക്വിവലന്റുകൾ WHO INN മാനദണ്ഡങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ള വിവരങ്ങൾ മാത്രമാണ്. ഏതൊരു മാറ്റത്തിനും മുമ്പ് ഫാർമസിസ്റ്റുമായി സ്ഥിരീകരിക്കുക.", psCallTitle:"യാത്രയ്ക്കുമുമ്പ് വിളിക്കുക:", psCall:"ഡാറ്റ 24 മണിക്കൂറിൽ കൂടുതൽ പഴയതാണെങ്കിൽ അല്ലെങ്കിൽ മരുന്ന് അത്യാവശ്യമാണെങ്കിൽ, നിലവിലെ സ്റ്റോക്ക് സ്ഥിരീകരിക്കാൻ ഡിസ്പെൻസറി കൗണ്ടറിൽ നേരിട്ട് വിളിക്കുക.", psEmergencyQ:"മെഡിക്കൽ അടിയന്തരാവസ്ഥ?", psEmergency:"ഈ പോർട്ടൽ ഉപയോഗിക്കരുത് - ഉടൻ അടിയന്തര സേവനങ്ങളെ വിളിക്കുക.", clinicalGuidance:"ക്ലിനിക്കൽ ഫോർമുലേഷൻ മാർഗ്ഗനിർദ്ദേശം:", clinicalGuidanceText:"സജീവ ഘടകം, ശക്തി, ഡോസേജ് ഫോം എന്നിവ ലൈസൻസുള്ള ഫാർമസിസ്റ്റിനോടോ ഡോക്ടറോടോ പരിശോധിക്കുക. ഈ പേജ് വിവരത്തിനായി മാത്രം.",
    healthMonitor:"⌁ പ്രവർത്തന ആരോഗ്യ & ഓഡിറ്റ് നിരീക്ഷണം", healthTitle:"ഡാറ്റ പുതുക്കൽ & സ്റ്റോക്ക് സിമുലേറ്റർ", healthLead:"ഡിസ്പെൻസറി ഡാറ്റ റിപ്പോർട്ടിംഗ് പാലനം നിരീക്ഷിക്കുക, പഴയതും പുതുതുമായ ഇൻവെന്ററി രേഖകൾ പരിശോധിക്കുക, റിയൽ-ടൈം സ്റ്റോക്ക് മാറ്റങ്ങൾ സിമുലേറ്റ് ചെയ്യുക.", refreshHealth:"⟳ ആരോഗ്യ സ്ഥിതിവിവരങ്ങൾ പുതുക്കുക", viewPublic:"പൊതു തിരച്ചിൽ കാണുക", simTitle:"ഇന്ററാക്ടീവ് സ്റ്റോക്ക് സിമുലേറ്റർ (ഹാക്കത്തോൺ ഡെമോ ടൂൾ)", simLead:"ഒരു സർക്കാർ ആരോഗ്യകേന്ദ്രവും ആവശ്യമായ മരുന്നും തിരഞ്ഞെടുത്ത് ലഭ്യത മാറ്റുക. അവസാന പുതുക്കൽ സമയം മാറുന്നതും തിരച്ചിൽ/കേന്ദ്ര പേജുകളിൽ ഫലം ഉടൻ പ്രതിഫലിക്കുന്നതും കാണുക.", liveWrite:"ലൈവ് ഡാറ്റാബേസ് എഴുത്ത്", simulatorTitle:"▣ ഡിസ്പെൻസറി സ്റ്റോക്ക് അപ്ഡേറ്റ് സിമുലേറ്റർ", simulatorSub:"റിയൽ-ടൈം ഡിസ്പെൻസറി സ്റ്റോക്ക് മാറ്റങ്ങൾ സിമുലേറ്റ് ചെയ്യുക", selectFacility:"സർക്കാർ ആരോഗ്യകേന്ദ്രം തിരഞ്ഞെടുക്കുക", selectMedicine:"അത്യാവശ്യ മരുന്ന് തിരഞ്ഞെടുക്കുക", newStatus:"പുതിയ സ്റ്റോക്ക് നില", inStock:"സ്റ്റോക്കിൽ", lowStock:"കുറഞ്ഞ സ്റ്റോക്ക്", outStock:"സ്റ്റോക്ക് തീർന്നു", auditReason:"ഓഡിറ്റ് കാരണം", verifier:"വെരിഫയർ & ലൈസൻസ് #", publishUpdate:"സ്റ്റോക്ക് അപ്ഡേറ്റ് പ്രസിദ്ധീകരിക്കുക", auditTitle:"സർക്കാർ കേന്ദ്ര റിപ്പോർട്ടിംഗ് ഓഡിറ്റ്", statCompliance:"റിപ്പോർട്ടിംഗ് പാലനം", statFresh:"പുതിയ ഡാറ്റ (മണിക്കൂർ)", statReporting:"റിപ്പോർട്ട് ചെയ്യുന്ന കേന്ദ്രങ്ങൾ", statStale:"പഴയത് / അവലോകനം ആവശ്യമാണ്", thFacility:"കേന്ദ്രം", thDistrict:"ജില്ല", thAudit:"അവസാന സ്റ്റോക്ക് ഓഡിറ്റ്", thFreshness:"പുതുമ", thScore:"പാലന സ്കോർ",
    inStockLabel:"സ്റ്റോക്കിൽ", lowLabel:"കുറഞ്ഞ സ്റ്റോക്ക്", outLabel:"തീർന്നു", totalLabel:"ആകെ കേന്ദ്രങ്ങൾ", distance:"ദൂരം", map:"മാപ്പ്", directions:"ദിശകൾ", call:"വിളിക്കുക", viewCatalog:"കാറ്റലോഗ് കാണുക →", formulary:"ഫോർമുലറി ലഭ്യത", updatedShort:"4 മണിക്കൂർ മുമ്പ് പുതുക്കി", centresInStock:"കേന്ദ്രങ്ങളിൽ സ്റ്റോക്കുണ്ട്", genericBio:"ജനറിക് ബയോഇക്വിവലന്റ്", activeIngredient:"സജീവ ഘടകം", verifyWithPharmacist:"ശക്തി, ഡോസേജ് ഫോം, സജീവ ഘടകം എന്നിവ ഫാർമസിസ്റ്റുമായി സ്ഥിരീകരിക്കുക.", locateMe:"ലൈവ് ലൊക്കേഷൻ ഉപയോഗിക്കുക", locating:"ലൊക്കേഷൻ കണ്ടെത്തുന്നു…", locationReady:"ലൈവ് ലൊക്കേഷൻ സജീവമാണ്", locationDenied:"ലൊക്കേഷൻ അനുമതി നിഷേധിച്ചു. ദൂരം ലഭ്യമല്ല.", distanceUnavailable:"ദൂരം ലഭ്യമല്ല", demoCoords:"ഡെമോ കേന്ദ്ര കോർഡിനേറ്റുകൾ"
  },
  hi:{
    demoBadge:"▣ डेमो डेटा", demoNoticeStrong:"हैकाथॉन मूल्यांकनकर्ताओं के लिए सूचना:", demoNotice:"सभी केंद्रों के स्टॉक स्तर, बैच नंबर और सत्यापन समय वास्तविक-जैसे डेमो डेटा हैं। यह पोर्टल लाइव राष्ट्रीय स्वास्थ्य डेटाबेस से जुड़ा नहीं है।", clinicalActive:"◉ क्लिनिकल एडवाइजरी सक्रिय　×", brandSub:"सरकारी फार्मेसी ट्रैकर", navFind:"दवा खोजें", navFacilities:"केंद्र", navEquiv:"जेनेरिक विकल्प", navHealth:"डेटा स्वास्थ्य", checkStock:"स्टॉक जांचें",
    findLabel:"सरकारी दवा उपलब्धता", findTitle:"यात्रा से पहले दवा खोजें।", findSub:"सरकारी डिस्पेंसरी का स्टॉक खोजें, पास के केंद्रों की तुलना करें और डेटा के अंतिम अपडेट की जांच करें।", medicine:"दवा", searchPlaceholder:"जैसे Amlodipine 5mg", search:"खोजें", searchResults:"खोज परिणाम", searchResultsSub:"सिम्युलेटेड वर्तमान उपलब्धता वाले सरकारी केंद्र।", updated:"● 4 घंटे पहले अपडेट", nearbyNetwork:"निकटवर्ती सरकारी नेटवर्क", networkTitle:"नेटवर्क में स्टॉक जांचें", networkSub:"यात्रा से पहले नमूना Metro District नेटवर्क देखें।", viewFacilities:"सभी केंद्र देखें →", locationView:"स्थान दृश्य", mapTitle:"पास का स्टॉक एक नजर में", mapSub:"डेमो केंद्रों की दूरी निकालने के लिए आपके ब्राउज़र का लाइव स्थान ही उपयोग होता है।", safetyTitle:"स्वास्थ्य सुरक्षा सूचना:", safetyBody:"MediFind केवल स्टॉक उपलब्धता निर्देशिका है, दवा लिखने की सेवा नहीं।", safetyStrong:"फार्मासिस्ट या चिकित्सक से सलाह लिए बिना दवा का विकल्प न बदलें।", emergencyTitle:"चिकित्सीय आपातकाल?", emergencyBody:"इस पोर्टल का उपयोग न करें — तुरंत आपातकालीन सेवाओं को कॉल करें।", emergency:"आपातकाल", healthline:"हेल्थलाइन", publicHealth:"सार्वजनिक स्वास्थ्य पहल", footerDesc:"सरकारी क्लिनिक, पॉलीक्लिनिक और अस्पताल डिस्पेंसरी तक मरीजों की अनावश्यक यात्रा कम करना। जनता के लिए सत्यापित स्टॉक, जेनेरिक विकल्प और डेटा ताजगी संकेतक उपलब्ध कराना।", builtWith:"◈ हैकाथॉन प्रोटोटाइप · HTML, CSS और JavaScript से निर्मित", coreModules:"मुख्य मॉड्यूल", moduleSearch:"दवा खोज", moduleFacilities:"केंद्र निर्देशिका", moduleEquiv:"जेनेरिक विकल्प", moduleHealth:"डेटा स्वास्थ्य मॉनिटर", healthSafety:"स्वास्थ्य और सुरक्षा", healthSafetyText:"यह केवल उपलब्धता खोजने का उपकरण है। लाइसेंसधारी फार्मासिस्ट या चिकित्सक से सलाह लिए बिना दवा न बदलें।", simulatedActive:"● सिम्युलेटेड डेमो डेटा सक्रिय", footerLinks:"गोपनीयता नीति　 क्लिनिकल मानक　 ओपन डेटा API",
    facilityNetwork:"सरकारी डिस्पेंसरी नेटवर्क", facilityTitle:"स्वास्थ्य केंद्र निर्देशिका", facilityLead:"Metro District नेटवर्क के सभी 8 सरकारी स्वास्थ्य केंद्र देखें। प्रत्येक केंद्र में स्टॉक दर, संचालन समय और डेटा ताजगी दिखाई जाती है।", chipHospitals:"2 सामान्य अस्पताल", chipPolyclinics:"2 पॉलीक्लिनिक", chipCommunity:"1 सामुदायिक केंद्र", chipPosts:"2 स्वास्थ्य पोस्ट", facilityMapTitle:"सभी केंद्र मानचित्र पर", facilityMapSub:"प्रत्येक डेमो केंद्र की दूरी निकालने के लिए स्थान की अनुमति दें।", facilitySafety:"यह हैकाथॉन प्रोटोटाइप में सिम्युलेटेड उपलब्धता है। यात्रा से पहले स्टॉक सीधे सत्यापित करें।",
    equivDirectory:"⌕ राष्ट्रीय फॉर्मुलरी समकक्षता निर्देशिका", equivTitle:"जेनेरिक और बायोइक्विवेलेंट दवाएं", equivLead:"निर्धारित ब्रांड दवाओं के सत्यापित बायोइक्विवेलेंट विकल्प देखें। निकटतम स्वास्थ्य केंद्र पर कोई ब्रांड उपलब्ध न हो तो सरकारी डिस्पेंसरी में समान सक्रिय घटक वाले जेनेरिक रूप उपलब्ध हो सकते हैं।", crucialNotice:"महत्वपूर्ण स्वास्थ्य सुरक्षा सूचना: केवल जानकारी के लिए", equivNotice:"MediFind दवाओं को बदलने का निर्देश नहीं देता। यहां सूचीबद्ध जेनेरिक विकल्प WHO INN और स्वास्थ्य मंत्रालय की फॉर्मुलरी दिशानिर्देशों पर आधारित केवल जानकारी हैं।", verifySub:"✓ किसी भी ब्रांड बदलाव से पहले फार्मासिस्ट या चिकित्सक से पुष्टि करें।", innTitle:"INN जेनेरिक क्या है?", innText:"International Non-proprietary Name (INN) सक्रिय औषधीय घटक की पहचान करता है। जेनेरिक दवा में ब्रांड दवा के समान सक्रिय पदार्थ और समान शक्ति होती है।", bioTitle:"सिद्ध बायोइक्विवेलेंस", bioText:"जेनेरिक दवाएं यह साबित करने के लिए कठोर परीक्षण से गुजरती हैं कि शरीर में दवा के अवशोषण की दर और मात्रा मूल दवा के समान है।", abundanceTitle:"सार्वजनिक डिस्पेंसरी उपलब्धता", abundanceText:"सरकारी स्वास्थ्य केंद्र सस्ती सार्वजनिक पहुंच के लिए जेनेरिक खरीद को प्राथमिकता देते हैं।", formularyTitle:"फॉर्मुलरी विकल्प", patientSafetyTitle:"रोगी सुरक्षा और चिकित्सा अस्वीकरण", publicHealthGuidance:"सार्वजनिक स्वास्थ्य मार्गदर्शन", psGuidance:"MediFind मरीजों की यात्रा का समय कम करने के लिए सार्वजनिक स्वास्थ्य डिस्पेंसरी में दवा उपलब्धता के अनुमान देता है।", psNot:"यह उपकरण निदान, दवा लिखने या दवा वितरित करने का काम नहीं करता।", psGenericTitle:"जेनेरिक विकल्प:", psGeneric:"सूचीबद्ध बायोइक्विवेलेंट WHO INN मानकों पर आधारित केवल जानकारी हैं। किसी भी विकल्प से पहले फार्मासिस्ट से पुष्टि करें।", psCallTitle:"यात्रा से पहले कॉल करें:", psCall:"यदि डेटा 24 घंटे से अधिक पुराना है या दवा महत्वपूर्ण है, तो वर्तमान स्टॉक की पुष्टि के लिए डिस्पेंसरी काउंटर पर सीधे कॉल करें।", psEmergencyQ:"चिकित्सीय आपातकाल?", psEmergency:"इस पोर्टल का उपयोग न करें - तुरंत आपातकालीन सेवाओं को कॉल करें।", clinicalGuidance:"क्लिनिकल फॉर्मुलेशन मार्गदर्शन:", clinicalGuidanceText:"सक्रिय घटक, शक्ति और खुराक रूप की पुष्टि लाइसेंसधारी फार्मासिस्ट या चिकित्सक से करें। यह पृष्ठ केवल जानकारी के लिए है।",
    healthMonitor:"⌁ संचालन स्वास्थ्य और ऑडिट मॉनिटर", healthTitle:"डेटा ताजगी और स्टॉक सिम्युलेटर", healthLead:"डिस्पेंसरी डेटा रिपोर्टिंग अनुपालन की निगरानी करें, पुराने और नए रिकॉर्ड देखें और इंटरैक्टिव स्टॉक सिम्युलेटर से रियल-टाइम बदलावों का परीक्षण करें।", refreshHealth:"⟳ स्वास्थ्य आंकड़े ताज़ा करें", viewPublic:"सार्वजनिक खोज देखें", simTitle:"इंटरैक्टिव स्टॉक सिम्युलेटर (हैकाथॉन डेमो टूल)", simLead:"किसी सरकारी स्वास्थ्य केंद्र और आवश्यक दवा का चयन कर उपलब्धता बदलें। अपडेट समय बदलते देखें और परिणाम खोज व केंद्र पृष्ठों पर तुरंत देखें।", liveWrite:"लाइव डेटाबेस लेखन", simulatorTitle:"▣ डिस्पेंसरी स्टॉक अपडेट सिम्युलेटर", simulatorSub:"रियल-टाइम डिस्पेंसरी स्टॉक बदलावों का सिमुलेशन करें", selectFacility:"सरकारी स्वास्थ्य केंद्र चुनें", selectMedicine:"आवश्यक दवा चुनें", newStatus:"नया स्टॉक स्तर", inStock:"स्टॉक में", lowStock:"कम स्टॉक", outStock:"स्टॉक समाप्त", auditReason:"ऑडिट कारण", verifier:"सत्यापनकर्ता और लाइसेंस #", publishUpdate:"स्टॉक अपडेट प्रकाशित करें", auditTitle:"सरकारी केंद्र रिपोर्टिंग ऑडिट", statCompliance:"रिपोर्टिंग अनुपालन", statFresh:"ताज़ा डेटा (घंटे)", statReporting:"रिपोर्ट करने वाले केंद्र", statStale:"पुराना / समीक्षा आवश्यक", thFacility:"केंद्र", thDistrict:"जिला", thAudit:"अंतिम स्टॉक ऑडिट", thFreshness:"ताजगी", thScore:"अनुपालन स्कोर",
    inStockLabel:"स्टॉक में", lowLabel:"कम स्टॉक", outLabel:"समाप्त", totalLabel:"कुल केंद्र", distance:"दूरी", map:"मानचित्र", directions:"दिशा", call:"कॉल", viewCatalog:"कैटलॉग देखें →", formulary:"फॉर्मुलरी उपलब्धता", updatedShort:"4 घंटे पहले अपडेट", centresInStock:"केंद्रों में स्टॉक", genericBio:"जेनेरिक बायोइक्विवेलेंट", activeIngredient:"सक्रिय घटक", verifyWithPharmacist:"शक्ति, खुराक रूप और सक्रिय घटक की पुष्टि फार्मासिस्ट से करें।", locateMe:"लाइव स्थान उपयोग करें", locating:"स्थान खोजा जा रहा है…", locationReady:"लाइव स्थान सक्रिय है", locationDenied:"स्थान अनुमति अस्वीकार हुई। दूरी उपलब्ध नहीं है।", distanceUnavailable:"दूरी उपलब्ध नहीं", demoCoords:"डेमो केंद्र निर्देशांक"
  }
};

function t(key){ return (translations[currentLanguage] && translations[currentLanguage][key]) || translations.en[key] || key; }

function applyLanguage(lang){
  if(!translations[lang]) lang="en";
  currentLanguage=lang;
  localStorage.setItem("medifindLanguage",lang);
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.dataset.i18n;
    if(translations[lang][key]) el.textContent=translations[lang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    const key=el.dataset.i18nPlaceholder;
    if(translations[lang][key]) el.placeholder=translations[lang][key];
  });
  const select=document.getElementById("language");
  if(select) select.value=lang;
  // Re-render dynamic sections so their text changes too.
  if(document.querySelector('.overview')) renderOverview();
  if(document.getElementById("facilities")) initFacilities();
  if(document.getElementById("equivalents")) initEquiv();
  if(document.getElementById("auditRows")) initAudit();
  if(document.getElementById("results") && !document.getElementById("results").classList.contains("hidden")) searchMedicine(false);
  if(mainMap || document.getElementById("liveMap")) initMainMap();
  if(facilitiesMap || document.getElementById("facilitiesMap")) initFacilitiesMap();
}

function facilityTypeLabel(type){
  if(currentLanguage==='ml') return ({"DISTRICT GENERAL HOSPITAL":"ജില്ലാ ജനറൽ ആശുപത്രി","URBAN POLYCLINIC":"നഗര പോളിക്ലിനിക്","PRIMARY HEALTH POST":"പ്രാഥമിക ഹെൽത്ത് പോസ്റ്റ്","SUB-DISTRICT HEALTH CENTRE":"സബ്-ഡിസ്ട്രിക്ട് ഹെൽത്ത് സെന്റർ","COMMUNITY HEALTH CENTRE":"കമ്മ്യൂണിറ്റി ഹെൽത്ത് സെന്റർ"}[type]||type);
  if(currentLanguage==='hi') return ({"DISTRICT GENERAL HOSPITAL":"जिला सामान्य अस्पताल","URBAN POLYCLINIC":"शहरी पॉलीक्लिनिक","PRIMARY HEALTH POST":"प्राथमिक स्वास्थ्य पोस्ट","SUB-DISTRICT HEALTH CENTRE":"उप-जिला स्वास्थ्य केंद्र","COMMUNITY HEALTH CENTRE":"सामुदायिक स्वास्थ्य केंद्र"}[type]||type);
  return type;
}

function card(f){
  const emergency=f.type.includes("GENERAL") ? "24/7 EMERGENCY" : "";
  const emergencyText=currentLanguage==='ml' ? "24/7 അടിയന്തര സേവനം" : currentLanguage==='hi' ? "24/7 आपातकाल" : emergency;
  const dist=f.distanceKm!=null ? `<span class="distance-badge">⌖ ${f.distanceKm.toFixed(1)} km</span>` : `<span class="distance-badge muted">⌖ ${t('distanceUnavailable')}</span>`;
  return `<article class="facility-card" data-facility="${escapeHtml(f.name)}"><div class="card-top ${f.color}">${facilityTypeLabel(f.type)}<span>${emergencyText}</span></div><div class="card-body"><h3>${escapeHtml(f.name)}</h3><p>⌖ ${escapeHtml(f.address)}</p><p>◷ ${escapeHtml(f.hours)}</p><p>☎ ${escapeHtml(f.phone)}</p>${dist}<div class="availability"><span>${t('formulary')}</span><b>${f.stock}%</b></div><i class="bar"><em style="width:${f.stock}%"></em></i><small>◉ ${f.inStock} ${t('inStockLabel')}　△ ${f.low} ${t('lowLabel')}　⊗ ${f.out} ${t('outLabel')}</small><div class="card-foot"><span>● ${t('updatedShort')}</span><div class="facility-actions"><a href="https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}" target="_blank" rel="noopener">⌖ ${t('map')}</a><a href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}" target="_blank" rel="noopener">➤ ${t('directions')}</a><a href="tel:${f.phone.replace(/[^+\d]/g,'')}">☎ ${t('call')}</a></div></div></div></article>`;
}

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function renderOverview(){
  const grid=document.querySelector('.overview .grid');
  if(!grid)return;
  const visible=facilities.slice(0,3);
  grid.innerHTML=visible.map(f=>`<article class="facility-card"><div class="card-top ${f.color}">${facilityTypeLabel(f.type)}<span>${f.type.includes("GENERAL")?(currentLanguage==='ml'?"24/7 അടിയന്തര സേവനം":currentLanguage==='hi'?"24/7 आपातकाल":"24/7 EMERGENCY"):""}</span></div><div class="card-body"><h3>${escapeHtml(f.name)}</h3><p>⌖ ${escapeHtml(f.address)}</p><p>◷ ${escapeHtml(f.hours)}</p><p>☎ ${escapeHtml(f.phone)}</p><div class="availability"><span>${t('formulary')}</span><b>${f.stock}%</b></div><i class="bar"><em style="width:${f.stock}%"></em></i><small>◉ ${f.inStock} ${t('inStockLabel')}　△ ${f.low} ${t('lowLabel')}　⊗ ${f.out} ${t('outLabel')}</small><div class="card-foot"><span>● ${t('updatedShort')}</span><a href="facilities.html">${t('viewCatalog')}</a></div></div></article>`).join('');
  const h=document.querySelector('.overview .section-head h2'); if(h)h.textContent=t('networkTitle');
  const p=document.querySelector('.overview .section-head p'); if(p)p.textContent=t('networkSub');
  const b=document.querySelector('.overview .section-head .outline-btn'); if(b)b.textContent=t('viewFacilities');
  const pill=document.querySelector('.overview .section-head .pill'); if(pill)pill.textContent=t('nearbyNetwork');
}

function setMedicine(x){const input=document.getElementById("medicineSearch");if(input){input.value=x;searchMedicine();}}
function focusSearch(){document.getElementById("medicineSearch")?.focus();}

function profileFor(query){
  const q=query.toLowerCase();
  for(const key of Object.keys(medicineProfiles)) if(q.includes(key)) return medicineProfiles[key];
  return {inStock:5,low:2,out:1};
}

function statusForFacility(f,index,profile){
  // Distribute the medicine-level facility counts consistently across the eight demo facilities.
  const order=[];
  const inSet=new Set([0,1,3,4,6,7]);
  const lowSet=new Set([2,5]);
  const outSet=new Set([4]);
  // Pick different deterministic patterns by profile to make search results change.
  const shift=(profile.inStock*2+profile.low)%8;
  const pos=(index+shift)%8;
  let status='in';
  if(profile.out>0 && pos>=8-profile.out) status='out';
  else if(profile.low>0 && pos>=8-profile.out-profile.low) status='low';
  return status;
}

function searchMedicine(scroll=true){
  const input=document.getElementById("medicineSearch");
  const q=(input?.value||"Amlodipine 5mg").trim() || "Amlodipine 5mg";
  const results=document.getElementById("results");
  if(!results) return;
  results.classList.remove("hidden");
  document.getElementById("resultTitle").textContent=q;
  const profile=profileFor(q);
  const summary=document.getElementById("stockSummary");
  if(summary) summary.innerHTML=`<div class="stock-summary-card in"><b>${profile.inStock}</b><span>● ${t('inStockLabel')}</span></div><div class="stock-summary-card low"><b>${profile.low}</b><span>△ ${t('lowLabel')}</span></div><div class="stock-summary-card out"><b>${profile.out}</b><span>⊗ ${t('outLabel')}</span></div><div class="stock-summary-card total"><b>${facilities.length}</b><span>${t('totalLabel')}</span></div>`;
  const ranked=facilities.map((f,i)=>{const copy={...f};const s=statusForFacility(f,i,profile);copy.inStock=s==='in'?1:0;copy.low=s==='low'?1:0;copy.out=s==='out'?1:0;copy.stock=s==='in'?100:s==='low'?45:0;copy.distanceKm=distanceFor(copy);return copy;}).sort((a,b)=>(a.distanceKm??9999)-(b.distanceKm??9999));
  document.getElementById("resultCards").innerHTML=ranked.map(card).join("");
  updateMainMap(ranked);
  if(scroll) results.scrollIntoView({behavior:"smooth",block:"start"});
}

function initFacilities(){const el=document.getElementById("facilities");if(el) el.innerHTML=facilities.map(f=>{const copy={...f,distanceKm:distanceFor(f)};return card(copy)}).join("");}

function initEquiv(){
  const el=document.getElementById("equivalents");
  if(!el)return;
  el.innerHTML=equivalents.map(x=>`<article class="equiv"><div class="equiv-head"><div><span class="pill teal">${t('genericBio')}</span><h3>${escapeHtml(x[1])}</h3><small>${escapeHtml(x[0])} → ${t('activeIngredient')}: ${escapeHtml(x[1])}</small></div><span class="stock">✓ ${escapeHtml(x[3])}</span></div><p>${t('centresInStock')} →</p><small>⌁ ${t('verifyWithPharmacist')}</small></article>`).join("");
}

function initAudit(){
  const el=document.getElementById("auditRows");
  if(!el)return;
  el.innerHTML=audit.map(x=>`<div class="tr"><span>${escapeHtml(x.f)}</span><span>${escapeHtml(x.d)}</span><span>${escapeHtml(x.last)}</span><span><b>${x.fresh}</b></span><span><div class="bar"><i style="width:${x.score}%"></i></div>${x.score}%</span></div>`).join("");
}

function setStatus(btn){document.querySelectorAll(".status").forEach(x=>x.classList.remove("active"));btn.classList.add("active");}
function publishUpdate(){const m=document.getElementById("updateMsg");if(m){m.textContent=currentLanguage==='ml'?"✓ ഡെമോ അപ്ഡേറ്റ് പ്രസിദ്ധീകരിച്ചു — സമയം ഇപ്പോൾ പുതുക്കി.":currentLanguage==='hi'?"✓ डेमो अपडेट प्रकाशित — समय अभी अपडेट किया गया।":"✓ Demo update published — timestamp refreshed just now.";setTimeout(()=>m.textContent="",5000)}}
function refreshStats(){alert(currentLanguage==='ml'?"ആരോഗ്യ സ്ഥിതിവിവരങ്ങൾ പുതുക്കി. ഡെമോ സമയങ്ങൾ അപ്ഡേറ്റ് ചെയ്തു.":currentLanguage==='hi'?"स्वास्थ्य आंकड़े ताज़ा किए गए। डेमो समय अपडेट हुआ।":"Health statistics refreshed. Demo timestamps updated.");}

function distanceKm(lat1,lon1,lat2,lon2){
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function distanceFor(f){return userLocation?distanceKm(userLocation.lat,userLocation.lng,f.lat,f.lng):null;}

function requestLiveLocation(){
  if(!navigator.geolocation){showLocationMessage('denied');return;}
  const btn=document.getElementById("locateBtn"); if(btn) btn.textContent=t('locating');
  navigator.geolocation.getCurrentPosition(pos=>{
    userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};
    localStorage.setItem("medifindLastLocation",JSON.stringify(userLocation));
    if(btn) btn.textContent=t('locationReady');
    initFacilities();
    if(document.getElementById("results") && !document.getElementById("results").classList.contains("hidden")) searchMedicine(false);
    initMainMap(); initFacilitiesMap();
  },()=>{
    if(btn) btn.textContent=t('locateMe');
    showLocationMessage('denied');
  },{enableHighAccuracy:true,timeout:10000,maximumAge:60000});
}
function showLocationMessage(type){
  let el=document.getElementById("locationMsg");
  if(!el){el=document.createElement('div');el.id='locationMsg';el.className='location-msg';document.querySelector('.container')?.prepend(el);}
  el.textContent=type==='denied'?t('locationDenied'):t('locationReady');
}

function initMainMap(){
  const el=document.getElementById('liveMap');
  if(!el || typeof L==='undefined') return;
  if(!mainMap){
    mainMap=L.map(el,{scrollWheelZoom:false}).setView([9.985,76.297],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(mainMap);
  }
  setTimeout(()=>mainMap.invalidateSize(),50);
  updateMainMap(facilities.map(f=>({...f,distanceKm:distanceFor(f)})));
}

function updateMainMap(items){
  if(!mainMap || typeof L==='undefined') return;
  mapMarkers.forEach(m=>mainMap.removeLayer(m)); mapMarkers=[];
  if(userLocation){
    if(locationMarker) mainMap.removeLayer(locationMarker);
    locationMarker=L.marker([userLocation.lat,userLocation.lng]).addTo(mainMap).bindPopup(`<b>${t('locateMe')}</b><br>${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`);
    locationMarker.openPopup();
    const bounds=L.latLngBounds([[userLocation.lat,userLocation.lng]]);
    items.forEach(f=>bounds.extend([f.lat,f.lng]));
    mainMap.fitBounds(bounds.pad(0.12));
  }
  items.forEach(f=>{
    const marker=L.marker([f.lat,f.lng]).addTo(mainMap).bindPopup(`<b>${escapeHtml(f.name)}</b><br>${f.distanceKm!=null?`${t('distance')}: ${f.distanceKm.toFixed(1)} km<br>`:''}<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}">${t('directions')}</a>`);
    mapMarkers.push(marker);
  });
}

function initFacilitiesMap(){
  const el=document.getElementById('facilitiesMap');
  if(!el || typeof L==='undefined') return;
  if(!facilitiesMap){
    facilitiesMap=L.map(el,{scrollWheelZoom:false}).setView([9.985,76.297],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(facilitiesMap);
  }
  setTimeout(()=>facilitiesMap.invalidateSize(),50);
  const bounds=L.latLngBounds(facilities.map(f=>[f.lat,f.lng]));
  if(userLocation) bounds.extend([userLocation.lat,userLocation.lng]);
  facilitiesMap.fitBounds(bounds.pad(0.12));
  facilitiesMap.eachLayer(layer=>{ if(layer instanceof L.Marker) facilitiesMap.removeLayer(layer); });
  facilities.forEach(f=>{
    const marker=L.marker([f.lat,f.lng]).addTo(facilitiesMap).bindPopup(`<b>${escapeHtml(f.name)}</b><br>${f.address}<br>${distanceFor(f)!=null?`${t('distance')}: ${distanceFor(f).toFixed(1)} km`:t('distanceUnavailable')}<br><a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}">${t('directions')}</a>`);
  });
}

function loadSavedLocation(){
  try{const saved=JSON.parse(localStorage.getItem("medifindLastLocation"));if(saved?.lat&&saved?.lng) userLocation=saved;}catch(e){}
}

function setupLocationButton(){
  if(document.getElementById('locateBtn')) return;
  const target=document.querySelector('.map-section > div:first-child') || document.querySelector('#facilitiesMap')?.previousElementSibling;
  if(!target) return;
  const btn=document.createElement('button');btn.id='locateBtn';btn.className='outline-btn location-btn';btn.textContent=userLocation?t('locationReady'):t('locateMe');btn.onclick=requestLiveLocation;target.appendChild(btn);
}

function setupSearchListener(){
  const input=document.getElementById('medicineSearch');
  if(!input)return;
  input.addEventListener('input',()=>{
    clearTimeout(searchTimer);
    if(input.value.trim().length>=2) searchTimer=setTimeout(()=>searchMedicine(false),250);
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter')searchMedicine();});
}

function init(){
  loadSavedLocation();
  const select=document.getElementById('language');
  if(select){select.value=currentLanguage;select.addEventListener('change',e=>applyLanguage(e.target.value));}
  initFacilities();initEquiv();initAudit();setupSearchListener();setupLocationButton();applyLanguage(currentLanguage);
  if(document.getElementById('liveMap')) initMainMap();
  if(document.getElementById('facilitiesMap')) initFacilitiesMap();
}

document.addEventListener('DOMContentLoaded',init);

/* ===== MediFind Upgrade Pack ===== */
Object.assign(translations.en, {
  filterLabel:"Filter", allStatuses:"All stock statuses", nearestFirst:"Nearest first", stockFirst:"Availability first", inStockFilter:"In Stock", lowFilter:"Low Stock", depletedFilter:"Depleted", clearFilter:"Clear", nearestAvailable:"Nearest facility with this medicine available", noMatches:"No facilities match this filter.", freshness:"Data freshness", freshData:"Fresh data", staleData:"Data older than 24h", liveLocation:"Live location", share:"Share", saved:"Saved", saveMedicine:"Save medicine", removeSaved:"Remove saved", savedMedicines:"Saved medicines", availabilityPrediction:"Availability signal", likelyAvailable:"Currently listed as available", checkBeforeTravel:"Confirm by phone before travelling", accessibility:"Accessibility", largerText:"Larger text", highContrast:"High contrast", resetView:"Reset view", stockFilter:"Stock filter", sortBy:"Sort by"
});
Object.assign(translations.ml, {
  filterLabel:"ഫിൽട്ടർ", allStatuses:"എല്ലാ സ്റ്റോക്ക് നിലകളും", nearestFirst:"ഏറ്റവും അടുത്തത് ആദ്യം", stockFirst:"ലഭ്യത ആദ്യം", inStockFilter:"സ്റ്റോക്കുണ്ട്", lowFilter:"കുറഞ്ഞ സ്റ്റോക്ക്", depletedFilter:"തീർന്നു", clearFilter:"മായ്ക്കുക", nearestAvailable:"ഈ മരുന്ന് ലഭ്യമായ ഏറ്റവും അടുത്ത കേന്ദ്രം", noMatches:"ഈ ഫിൽട്ടറിന് അനുയോജ്യമായ കേന്ദ്രങ്ങളില്ല.", freshness:"ഡാറ്റ പുതുക്കൽ", freshData:"പുതിയ ഡാറ്റ", staleData:"24 മണിക്കൂറിൽ കൂടുതലായ ഡാറ്റ", liveLocation:"ലൈവ് ലൊക്കേഷൻ", share:"പങ്കിടുക", saved:"സംരക്ഷിച്ചു", saveMedicine:"മരുന്ന് സംരക്ഷിക്കുക", removeSaved:"സംരക്ഷിച്ചത് നീക്കം ചെയ്യുക", savedMedicines:"സംരക്ഷിച്ച മരുന്നുകൾ", availabilityPrediction:"ലഭ്യത സൂചന", likelyAvailable:"നിലവിൽ ലഭ്യമെന്ന് രേഖപ്പെടുത്തിയിട്ടുണ്ട്", checkBeforeTravel:"യാത്രയ്ക്കുമുമ്പ് ഫോണിൽ സ്ഥിരീകരിക്കുക", accessibility:"ആക്സസിബിലിറ്റി", largerText:"വലിയ അക്ഷരങ്ങൾ", highContrast:"ഉയർന്ന കോൺട്രാസ്റ്റ്", resetView:"കാഴ്ച പുനഃസ്ഥാപിക്കുക", stockFilter:"സ്റ്റോക്ക് ഫിൽട്ടർ", sortBy:"ക്രമീകരിക്കുക"
});
Object.assign(translations.hi, {
  filterLabel:"फ़िल्टर", allStatuses:"सभी स्टॉक स्थिति", nearestFirst:"सबसे पास पहले", stockFirst:"उपलब्धता पहले", inStockFilter:"स्टॉक में", lowFilter:"कम स्टॉक", depletedFilter:"समाप्त", clearFilter:"साफ़ करें", nearestAvailable:"यह दवा उपलब्ध कराने वाला सबसे नज़दीकी केंद्र", noMatches:"इस फ़िल्टर से कोई केंद्र मेल नहीं खाता।", freshness:"डेटा ताज़गी", freshData:"ताज़ा डेटा", staleData:"24 घंटे से पुराना डेटा", liveLocation:"लाइव लोकेशन", share:"साझा करें", saved:"सहेजा गया", saveMedicine:"दवा सहेजें", removeSaved:"सहेजी दवा हटाएँ", savedMedicines:"सहेजी दवाएँ", availabilityPrediction:"उपलब्धता संकेत", likelyAvailable:"वर्तमान में उपलब्ध दर्ज है", checkBeforeTravel:"यात्रा से पहले फोन पर पुष्टि करें", accessibility:"एक्सेसिबिलिटी", largerText:"बड़ा टेक्स्ट", highContrast:"उच्च कॉन्ट्रास्ट", resetView:"दृश्य रीसेट", stockFilter:"स्टॉक फ़िल्टर", sortBy:"क्रमबद्ध करें"
});

let activeStockFilter='all';
let activeSort='nearest';
let currentSearchQuery='';

function stockStatus(f){
  if(f.out>0 && f.inStock===0 && f.low===0) return 'out';
  if(f.low>0 && f.inStock===0) return 'low';
  if(f.inStock>0) return 'in';
  if(f.out>0) return 'out';
  return 'in';
}
function freshnessClass(){return 'freshness-badge';}
function localizedFreshness(){return t('updatedShort');}
function addActionButtonsToCard(f){
  const phone=f.phone.replace(/[^+\d]/g,'');
  return `<div class="facility-actions"><a href="https://www.google.com/maps/search/?api=1&query=${f.lat},${f.lng}" target="_blank" rel="noopener">⌖ ${t('map')}</a><a href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}" target="_blank" rel="noopener">➤ ${t('directions')}</a><a href="tel:${phone}">☎ ${t('call')}</a></div>`;
}

// Replace the card renderer so every facility has translated actions, freshness, and distance.
function card(f){
  const emergency=f.type.includes("GENERAL") ? "24/7 EMERGENCY" : "";
  const emergencyText=currentLanguage==='ml' ? "24/7 അടിയന്തര സേവനം" : currentLanguage==='hi' ? "24/7 आपातकाल" : emergency;
  const dist=f.distanceKm!=null ? `<span class="distance-badge">⌖ ${f.distanceKm.toFixed(1)} km</span>` : `<span class="distance-badge muted">⌖ ${t('distanceUnavailable')}</span>`;
  const status=stockStatus(f);
  const freshness= f.dataHours>24 ? `<span class="freshness-badge stale">● ${t('staleData')}</span>` : `<span class="freshness-badge">● ${localizedFreshness()}</span>`;
  const medicinePart=currentSearchQuery ? `<span class="freshness-badge">${t('availabilityPrediction')}: ${status==='in'?t('likelyAvailable'):status==='low'?t('lowFilter'):t('depleted')}</span>` : '';
  return `<article class="facility-card" data-facility="${escapeHtml(f.name)}" data-status="${status}"><div class="card-top ${f.color}">${facilityTypeLabel(f.type)}<span>${emergencyText}</span></div><div class="card-body"><h3>${escapeHtml(f.name)}</h3><p>⌖ ${escapeHtml(f.address)}</p><p>◷ ${escapeHtml(f.hours)}</p><p>☎ ${escapeHtml(f.phone)}</p>${dist}<div>${freshness} ${medicinePart}</div><div class="availability"><span>${t('formulary')}</span><b>${f.stock}%</b></div><i class="bar"><em style="width:${f.stock}%"></em></i><small>◉ ${f.inStock} ${t('inStockLabel')}　△ ${f.low} ${t('lowLabel')}　⊗ ${f.out} ${t('outLabel')}</small><div class="card-foot"><span>● ${t('updatedShort')}</span>${addActionButtonsToCard(f)}</div></div></article>`;
}

function renderResultTools(){
  const el=document.getElementById('resultTools'); if(!el)return;
  el.innerHTML=`<span class="filter-label">${t('stockFilter')}</span><button class="${activeStockFilter==='all'?'active':''}" onclick="setStockFilter('all')">${t('allStatuses')}</button><button class="${activeStockFilter==='in'?'active':''}" onclick="setStockFilter('in')">🟢 ${t('inStockFilter')}</button><button class="${activeStockFilter==='low'?'active':''}" onclick="setStockFilter('low')">🟡 ${t('lowFilter')}</button><button class="${activeStockFilter==='out'?'active':''}" onclick="setStockFilter('out')">🔴 ${t('depletedFilter')}</button><select onchange="setResultSort(this.value)" aria-label="${t('sortBy')}"><option value="nearest" ${activeSort==='nearest'?'selected':''}>${t('nearestFirst')}</option><option value="stock" ${activeSort==='stock'?'selected':''}>${t('stockFirst')}</option></select><button onclick="clearResultFilter()">${t('clearFilter')}</button>`;
}
function setStockFilter(v){activeStockFilter=v;renderSearchCards();}
function setResultSort(v){activeSort=v;renderSearchCards();}
function clearResultFilter(){activeStockFilter='all';activeSort='nearest';renderSearchCards();}
function renderSearchCards(){
  const profile=profileFor(currentSearchQuery||'Amlodipine 5mg');
  let ranked=facilities.map((f,i)=>{const copy={...f};const s=statusForFacility(f,i,profile);copy.inStock=s==='in'?1:0;copy.low=s==='low'?1:0;copy.out=s==='out'?1:0;copy.stock=s==='in'?100:s==='low'?45:0;copy.distanceKm=distanceFor(copy);copy.dataHours=4;return copy;});
  if(activeStockFilter!=='all') ranked=ranked.filter(f=>stockStatus(f)===activeStockFilter);
  if(activeSort==='nearest') ranked.sort((a,b)=>(a.distanceKm??9999)-(b.distanceKm??9999));
  else ranked.sort((a,b)=>b.stock-a.stock);
  const container=document.getElementById('resultCards');
  if(container) container.innerHTML=ranked.length?ranked.map(card).join(''):`<div class="safety">${t('noMatches')}</div>`;
  const available=ranked.find(f=>stockStatus(f)==='in');
  const old=document.getElementById('nearestBanner'); if(old)old.remove();
  if(available && currentSearchQuery){
    const banner=document.createElement('div');banner.id='nearestBanner';banner.className='nearest-banner';banner.innerHTML=`📍 ${t('nearestAvailable')}: <b>${escapeHtml(available.name)}</b>${available.distanceKm!=null?` — ${available.distanceKm.toFixed(1)} km`:''} <span style="float:right">🟢 ${t('likelyAvailable')}</span>`;
    document.getElementById('resultCards')?.parentElement?.insertBefore(banner,document.getElementById('resultCards'));
  }
  updateMainMap(ranked);
}

function searchMedicine(scroll=true){
  const input=document.getElementById("medicineSearch");
  const q=(input?.value||"Amlodipine 5mg").trim() || "Amlodipine 5mg";
  const results=document.getElementById("results"); if(!results)return;
  currentSearchQuery=q; results.classList.remove("hidden");
  const title=document.getElementById('resultTitle'); if(title)title.textContent=q;
  const profile=profileFor(q);
  const summary=document.getElementById("stockSummary");
  if(summary)summary.innerHTML=`<div class="stock-summary-card in"><b>${profile.inStock}</b><span>● ${t('inStockLabel')}</span></div><div class="stock-summary-card low"><b>${profile.low}</b><span>△ ${t('lowLabel')}</span></div><div class="stock-summary-card out"><b>${profile.out}</b><span>⊗ ${t('outLabel')}</span></div><div class="stock-summary-card total"><b>${facilities.length}</b><span>${t('totalLabel')}</span></div>`;
  renderResultTools(); renderSearchCards();
  if(scroll)results.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderFacilityTools(){
  const el=document.getElementById('facilityTools'); if(!el)return;
  el.innerHTML=`<span class="filter-label">${t('filterLabel')}</span><button class="${activeStockFilter==='all'?'active':''}" onclick="setFacilityFilter('all')">${t('allStatuses')}</button><button class="${activeStockFilter==='in'?'active':''}" onclick="setFacilityFilter('in')">🟢 ${t('inStockFilter')}</button><button class="${activeStockFilter==='low'?'active':''}" onclick="setFacilityFilter('low')">🟡 ${t('lowFilter')}</button><button class="${activeStockFilter==='out'?'active':''}" onclick="setFacilityFilter('out')">🔴 ${t('depletedFilter')}</button><select onchange="setFacilitySort(this.value)"><option value="nearest" ${activeSort==='nearest'?'selected':''}>${t('nearestFirst')}</option><option value="stock" ${activeSort==='stock'?'selected':''}>${t('stockFirst')}</option></select><button onclick="clearFacilityFilter()">${t('clearFilter')}</button>`;
}
function renderFacilitiesCards(){
  const el=document.getElementById('facilities'); if(!el)return;
  let list=facilities.map(f=>({...f,distanceKm:distanceFor(f),dataHours:4}));
  if(activeStockFilter!=='all')list=list.filter(f=>stockStatus(f)===activeStockFilter);
  if(activeSort==='nearest')list.sort((a,b)=>(a.distanceKm??9999)-(b.distanceKm??9999)); else list.sort((a,b)=>b.stock-a.stock);
  el.innerHTML=list.length?list.map(card).join(''):`<div class="safety">${t('noMatches')}</div>`;
}
function setFacilityFilter(v){activeStockFilter=v;renderFacilityTools();renderFacilitiesCards();}
function setFacilitySort(v){activeSort=v;renderFacilityTools();renderFacilitiesCards();}
function clearFacilityFilter(){activeStockFilter='all';activeSort='nearest';renderFacilityTools();renderFacilitiesCards();}
function initFacilities(){renderFacilityTools();renderFacilitiesCards();}

function setupExtraTools(){
  // Save/share controls under the search panel, without changing its visual style.
  const panel=document.getElementById('searchBox');
  if(panel && !document.getElementById('extraTools')){
    const wrap=document.createElement('div');wrap.id='extraTools';wrap.className='accessibility-tools';
    wrap.innerHTML=`<button type="button" onclick="saveCurrentMedicine()">♡ ${t('saveMedicine')}</button><button type="button" onclick="shareCurrentMedicine()">↗ ${t('share')}</button><button type="button" onclick="toggleLargeText()">A+ ${t('largerText')}</button><button type="button" onclick="toggleContrast()">◐ ${t('highContrast')}</button>`;
    panel.appendChild(wrap);
  }
}
function saveCurrentMedicine(){
  const input=document.getElementById('medicineSearch');const q=(input?.value||'').trim();if(!q)return;
  const saved=JSON.parse(localStorage.getItem('medifindSavedMedicines')||'[]'); if(!saved.includes(q))saved.push(q); localStorage.setItem('medifindSavedMedicines',JSON.stringify(saved));
  const btn=document.querySelector('#extraTools button');if(btn)btn.textContent='✓ '+t('saved');
}
async function shareCurrentMedicine(){
  const q=document.getElementById('medicineSearch')?.value.trim();if(!q)return;
  const text=`MediFind: ${q} — demo medicine availability`;
  try{if(navigator.share)await navigator.share({title:'MediFind',text,url:location.href});else if(navigator.clipboard){await navigator.clipboard.writeText(text+' '+location.href);alert(t('share')+' ✓');}}catch(e){}
}
function toggleLargeText(){document.body.classList.toggle('large-text');localStorage.setItem('medifindLargeText',document.body.classList.contains('large-text'));}
function toggleContrast(){document.body.classList.toggle('high-contrast');localStorage.setItem('medifindContrast',document.body.classList.contains('high-contrast'));}

// Override language application so newly added controls are translated too.
const originalApplyLanguage=applyLanguage;
applyLanguage=function(lang){originalApplyLanguage(lang);setupExtraTools();renderResultTools();renderFacilityTools();};

// Keep location-driven distances fresh when permission is granted.
const originalRequestLiveLocation=requestLiveLocation;
requestLiveLocation=function(){
  originalRequestLiveLocation();
};

const originalInit=init;
init=function(){
  if(localStorage.getItem('medifindLargeText')==='true')document.body.classList.add('large-text');
  if(localStorage.getItem('medifindContrast')==='true')document.body.classList.add('high-contrast');
  originalInit();setupExtraTools();
};

document.addEventListener('DOMContentLoaded',()=>{
  setupExtraTools();
  if(localStorage.getItem('medifindLargeText')==='true')document.body.classList.add('large-text');
  if(localStorage.getItem('medifindContrast')==='true')document.body.classList.add('high-contrast');
  renderResultTools();renderFacilityTools();
});

// Distinguish medicine-specific status from overall facility formulary status.
const _stockStatus = stockStatus;
stockStatus=function(f){
  if(f.medicineSpecific){
    if(f.inStock>0)return 'in';
    if(f.low>0)return 'low';
    return 'out';
  }
  if(f.stock>=70)return 'in';
  if(f.stock>=35)return 'low';
  return 'out';
};
// Mark search-rendered records as medicine-specific.
const _renderSearchCards = renderSearchCards;
renderSearchCards=function(){
  // Rebuild the same list here so the status filter uses medicine-specific values.
  const profile=profileFor(currentSearchQuery||'Amlodipine 5mg');
  let ranked=facilities.map((f,i)=>{const copy={...f};const s=statusForFacility(f,i,profile);copy.inStock=s==='in'?1:0;copy.low=s==='low'?1:0;copy.out=s==='out'?1:0;copy.stock=s==='in'?100:s==='low'?45:0;copy.distanceKm=distanceFor(copy);copy.dataHours=4;copy.medicineSpecific=true;return copy;});
  if(activeStockFilter!=='all') ranked=ranked.filter(f=>stockStatus(f)===activeStockFilter);
  if(activeSort==='nearest') ranked.sort((a,b)=>(a.distanceKm??9999)-(b.distanceKm??9999)); else ranked.sort((a,b)=>b.stock-a.stock);
  const container=document.getElementById('resultCards');
  if(container)container.innerHTML=ranked.length?ranked.map(card).join(''):`<div class="safety">${t('noMatches')}</div>`;
  const available=ranked.find(f=>stockStatus(f)==='in');
  document.getElementById('nearestBanner')?.remove();
  if(available && currentSearchQuery){const banner=document.createElement('div');banner.id='nearestBanner';banner.className='nearest-banner';banner.innerHTML=`📍 ${t('nearestAvailable')}: <b>${escapeHtml(available.name)}</b>${available.distanceKm!=null?` — ${available.distanceKm.toFixed(1)} km`:''} <span style="float:right">🟢 ${t('likelyAvailable')}</span>`;document.getElementById('resultCards')?.parentElement?.insertBefore(banner,document.getElementById('resultCards'));}
  updateMainMap(ranked);
};

/* ===== Final requested additions: medicine details + verifier validation + automatic audit trail ===== */
const medicineDetails = {
  amlodipine:{generic:"Amlodipine",strength:"5 mg",form:"Tablet",category:"Cardiovascular / Hypertension",uses:"Used to help control high blood pressure and certain types of angina.",note:"Availability information only — use only as directed by a qualified clinician."},
  metformin:{generic:"Metformin hydrochloride",strength:"500 mg",form:"Tablet",category:"Endocrine / Diabetes",uses:"Commonly used as part of treatment for type 2 diabetes.",note:"Availability information only — follow the prescription and pharmacist guidance."},
  paracetamol:{generic:"Paracetamol (Acetaminophen)",strength:"500 mg",form:"Tablet",category:"Analgesic / Antipyretic",uses:"Commonly used for temporary relief of pain and fever.",note:"Do not exceed the prescribed or labelled dose."},
  amoxicillin:{generic:"Amoxicillin",strength:"500 mg",form:"Capsule / Tablet",category:"Antibiotic / Anti-infective",uses:"An antibiotic used for certain bacterial infections when prescribed.",note:"Antibiotics should be taken only when prescribed by a qualified clinician."},
  clavulanate:{generic:"Amoxicillin + Clavulanate",strength:"625 mg",form:"Tablet",category:"Antibiotic / Anti-infective",uses:"Prescription antibiotic combination used for selected bacterial infections.",note:"Use only on professional medical advice."},
  azithromycin:{generic:"Azithromycin",strength:"500 mg",form:"Tablet",category:"Antibiotic / Anti-infective",uses:"Prescription antibiotic used for selected bacterial infections.",note:"Use only when prescribed."},
  ibuprofen:{generic:"Ibuprofen",strength:"400 mg",form:"Tablet",category:"Analgesic / Anti-inflammatory",uses:"Used for temporary relief of pain and inflammation.",note:"Check with a pharmacist or clinician if this medicine is appropriate for you."},
  valsartan:{generic:"Valsartan",strength:"160 mg",form:"Tablet",category:"Cardiovascular / Hypertension",uses:"Used to help manage high blood pressure and certain cardiovascular conditions.",note:"Take according to the prescription."},
  omeprazole:{generic:"Omeprazole",strength:"20 mg",form:"Capsule / Tablet",category:"Gastrointestinal",uses:"Reduces stomach acid and is used for several acid-related conditions.",note:"Use according to professional advice."},
  salbutamol:{generic:"Salbutamol",strength:"100 mcg",form:"Inhaler",category:"Respiratory",uses:"A reliever medicine used to ease bronchospasm in conditions such as asthma.",note:"Use the inhaler technique taught by your clinician or pharmacist."}
};

Object.assign(translations.en, {
  medicineDetailsTitle:"Medicine Details", genericName:"Generic name", strength:"Strength", dosageForm:"Dosage form", category:"Category", commonUse:"Common use", medicineInfoNote:"Information shown here is for medicine identification and availability only. It does not replace a prescription or professional medical advice.",
  verifierHint:"Authorized demo verifier: Staff Pharmacist (K. Tan, Reg #PH-4821)", verifierInvalid:"⚠ Verifier or license number is not recognized. Please enter the correct authorized verifier and license number before publishing the stock update.", verifierValid:"✓ Verifier and license verified for this hackathon demo.", auditTrailTitle:"Automatic Audit Trail", auditRecorded:"Audit entry recorded automatically", noAuditEntries:"No audit entries recorded yet.", auditVerifier:"Verifier", auditAction:"Action", auditTime:"Time", auditReasonLabel:"Reason", auditStatus:"Status", verificationFailed:"Verification failed — stock update was not published.", verificationPassed:"Verified — stock update published and audit entry recorded."
});
Object.assign(translations.ml, {
  medicineDetailsTitle:"മരുന്നിന്റെ വിശദാംശങ്ങൾ", genericName:"ജനറിക് പേര്", strength:"ശക്തി", dosageForm:"ഡോസ് രൂപം", category:"വിഭാഗം", commonUse:"സാധാരണ ഉപയോഗം", medicineInfoNote:"ഇവിടെയുള്ള വിവരങ്ങൾ മരുന്ന് തിരിച്ചറിയാനും ലഭ്യത അറിയാനും മാത്രമാണ്. ഇത് പ്രിസ്ക്രിപ്ഷനോ പ്രൊഫഷണൽ മെഡിക്കൽ ഉപദേശമോ പകരം വയ്ക്കുന്നില്ല.",
  verifierHint:"അംഗീകൃത ഡെമോ വെരിഫയർ: Staff Pharmacist (K. Tan, Reg #PH-4821)", verifierInvalid:"⚠ വെരിഫയർ അല്ലെങ്കിൽ ലൈസൻസ് നമ്പർ അംഗീകരിച്ചിട്ടില്ല. സ്റ്റോക്ക് അപ്ഡേറ്റ് പ്രസിദ്ധീകരിക്കുന്നതിന് മുമ്പ് ശരിയായ അംഗീകൃത വെരിഫയറും ലൈസൻസ് നമ്പറും നൽകുക.", verifierValid:"✓ ഈ ഹാക്കത്തോൺ ഡെമോയ്ക്കുള്ള വെരിഫയറും ലൈസൻസും പരിശോധിച്ചു.", auditTrailTitle:"ഓട്ടോമാറ്റിക് ഓഡിറ്റ് ട്രെയിൽ", auditRecorded:"ഓഡിറ്റ് എൻട്രി സ്വയമേവ രേഖപ്പെടുത്തി", noAuditEntries:"ഇതുവരെ ഓഡിറ്റ് എൻട്രികളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.", auditVerifier:"വെരിഫയർ", auditAction:"പ്രവർത്തനം", auditTime:"സമയം", auditReasonLabel:"കാരണം", auditStatus:"നില", verificationFailed:"വെരിഫിക്കേഷൻ പരാജയപ്പെട്ടു — സ്റ്റോക്ക് അപ്ഡേറ്റ് പ്രസിദ്ധീകരിച്ചില്ല.", verificationPassed:"പരിശോധിച്ചു — സ്റ്റോക്ക് അപ്ഡേറ്റ് പ്രസിദ്ധീകരിക്കുകയും ഓഡിറ്റ് എൻട്രി രേഖപ്പെടുത്തുകയും ചെയ്തു."
});
Object.assign(translations.hi, {
  medicineDetailsTitle:"दवा विवरण", genericName:"जेनेरिक नाम", strength:"शक्ति", dosageForm:"खुराक रूप", category:"श्रेणी", commonUse:"सामान्य उपयोग", medicineInfoNote:"यह जानकारी केवल दवा की पहचान और उपलब्धता के लिए है। यह प्रिस्क्रिप्शन या पेशेवर चिकित्सा सलाह का विकल्प नहीं है।",
  verifierHint:"अधिकृत डेमो सत्यापनकर्ता: Staff Pharmacist (K. Tan, Reg #PH-4821)", verifierInvalid:"⚠ सत्यापनकर्ता या लाइसेंस नंबर मान्य नहीं है। स्टॉक अपडेट प्रकाशित करने से पहले सही अधिकृत सत्यापनकर्ता और लाइसेंस नंबर दर्ज करें।", verifierValid:"✓ इस हैकाथॉन डेमो के लिए सत्यापनकर्ता और लाइसेंस सत्यापित है।", auditTrailTitle:"स्वचालित ऑडिट ट्रेल", auditRecorded:"ऑडिट प्रविष्टि अपने आप दर्ज हुई", noAuditEntries:"अभी तक कोई ऑडिट प्रविष्टि दर्ज नहीं हुई है।", auditVerifier:"सत्यापनकर्ता", auditAction:"कार्रवाई", auditTime:"समय", auditReasonLabel:"कारण", auditStatus:"स्थिति", verificationFailed:"सत्यापन विफल — स्टॉक अपडेट प्रकाशित नहीं हुआ।", verificationPassed:"सत्यापित — स्टॉक अपडेट प्रकाशित हुआ और ऑडिट प्रविष्टि दर्ज हुई।"
});

function detailFor(query){
  const q=(query||'').toLowerCase();
  for(const key of Object.keys(medicineDetails)) if(q.includes(key)) return medicineDetails[key];
  return {generic:query||'Medicine',strength:'—',form:'—',category:'General medicine',uses:'Search result available in the demo inventory.',note:'Verify the exact medicine, strength and dosage form with a pharmacist or clinician.'};
}
function renderMedicineDetails(query){
  const el=document.getElementById('medicineDetails'); if(!el)return;
  const d=detailFor(query);
  el.innerHTML=`<div class="section-head" style="margin-bottom:0"><div><span class="pill teal">${t('medicineDetailsTitle').toUpperCase()}</span><h3 style="margin:8px 0 0">${escapeHtml(query)}</h3></div></div><div class="medicine-details-grid"><div class="medicine-detail-item"><span>${t('genericName')}</span><b>${escapeHtml(d.generic)}</b></div><div class="medicine-detail-item"><span>${t('strength')}</span><b>${escapeHtml(d.strength)}</b></div><div class="medicine-detail-item"><span>${t('dosageForm')}</span><b>${escapeHtml(d.form)}</b></div><div class="medicine-detail-item"><span>${t('category')}</span><b>${escapeHtml(d.category)}</b></div></div><p class="medicine-detail-description"><b>${t('commonUse')}:</b> ${escapeHtml(d.uses)}</p><p class="medicine-detail-description">⚠ ${escapeHtml(d.note)} ${t('medicineInfoNote')}</p>`;
}

const _searchMedicineWithDetails = searchMedicine;
searchMedicine = function(scroll=true){
  _searchMedicineWithDetails(scroll);
  const input=document.getElementById('medicineSearch');
  const q=(input?.value||'Amlodipine 5mg').trim() || 'Amlodipine 5mg';
  currentSearchQuery=q;
  renderMedicineDetails(q);
};

const authorizedDemoVerifiers = new Set([
  'staff pharmacist (k. tan, reg #ph-4821)'
]);
function normalizeVerifier(value){return String(value||'').trim().replace(/\s+/g,' ').toLowerCase();}
function verifierIsValid(){
  const input=document.getElementById('verifierInput');
  return authorizedDemoVerifiers.has(normalizeVerifier(input?.value));
}
function renderVerifierFeedback(type,message){
  const el=document.getElementById('verifierFeedback'); if(!el)return;
  el.className=type==='valid'?'verifier-success':'verifier-warning';
  el.innerHTML=message;
}
function renderAuditTrail(){
  const rows=document.getElementById('auditTrailRows'); if(!rows)return;
  const entries=JSON.parse(localStorage.getItem('medifindAuditTrail')||'[]');
  const count=document.getElementById('auditTrailCount');
  if(count)count.textContent=entries.length?`${entries.length} ${t('auditRecorded')}`:'';
  if(!entries.length){rows.innerHTML=`<div style="padding:16px;color:#69767d">${t('noAuditEntries')}</div>`;return;}
  rows.innerHTML=entries.slice().reverse().map(x=>`<div class="audit-entry"><div><b>${escapeHtml(x.facility)}</b><br><small>${escapeHtml(x.medicine)}</small></div><div><b>${t('auditVerifier')}</b><br><small>${escapeHtml(x.verifier)}</small></div><div><b>${t('auditAction')}</b><br><small>${escapeHtml(x.status)}</small></div><div><b>${t('auditTime')}</b><br><small>${escapeHtml(x.time)}</small></div><div><b>${t('auditReasonLabel')}</b><br><small>${escapeHtml(x.reason)}</small></div></div>`).join('');
}

publishUpdate = function(){
  const verifier=document.getElementById('verifierInput')?.value||'';
  const reason=document.getElementById('auditReasonInput')?.value.trim()||'';
  if(!verifierIsValid()){
    renderVerifierFeedback('invalid',t('verifierInvalid')+'<br><small>'+escapeHtml(t('verifierHint'))+'</small>');
    const msg=document.getElementById('updateMsg'); if(msg)msg.textContent=t('verificationFailed');
    return;
  }
  const facility=document.getElementById('facilitySelect')?.value||'Government facility';
  const medicine=document.querySelector('#facilitySelect')?.parentElement?.parentElement?.querySelectorAll('select')[1]?.value||'Selected medicine';
  const statusBtn=document.querySelector('.status.active');
  const status=statusBtn?.innerText?.replace(/[✓△⊗]/g,'').trim()||'IN STOCK';
  const entry={facility,medicine,status,verifier,time:new Date().toLocaleString(),reason:reason||'Stock update published'};
  const entries=JSON.parse(localStorage.getItem('medifindAuditTrail')||'[]');
  entries.push(entry); localStorage.setItem('medifindAuditTrail',JSON.stringify(entries.slice(-20)));
  renderVerifierFeedback('valid',t('verifierValid'));
  const m=document.getElementById('updateMsg');if(m)m.textContent=t('verificationPassed');
  renderAuditTrail();
  setTimeout(()=>{if(m)m.textContent='';},5000);
};

const _applyLanguageFinal = applyLanguage;
applyLanguage = function(lang){
  _applyLanguageFinal(lang);
  renderMedicineDetails(currentSearchQuery || document.getElementById('medicineSearch')?.value || 'Amlodipine 5mg');
  renderAuditTrail();
  const hint=document.getElementById('verifierInput');
  if(hint && document.activeElement!==hint){
    const feedback=document.getElementById('verifierFeedback');
    if(feedback && feedback.classList.contains('verifier-warning')) renderVerifierFeedback('invalid',t('verifierInvalid')+'<br><small>'+escapeHtml(t('verifierHint'))+'</small>');
  }
};

document.addEventListener('DOMContentLoaded',()=>{
  renderAuditTrail();
  const verifier=document.getElementById('verifierInput');
  if(verifier){
    verifier.addEventListener('blur',()=>{
      if(verifier.value.trim() && !verifierIsValid()) renderVerifierFeedback('invalid',t('verifierInvalid')+'<br><small>'+escapeHtml(t('verifierHint'))+'</small>');
      else if(verifier.value.trim()) renderVerifierFeedback('valid',t('verifierValid'));
    });
    verifier.addEventListener('input',()=>{
      const fb=document.getElementById('verifierFeedback'); if(fb)fb.innerHTML='';
    });
  }
});


/* ===== COMPLETE FACILITY LANGUAGE PACK ===== */
// Facility names, addresses, opening hours and map details are translated together
// with the rest of the interface. Demo data only; phone numbers remain unchanged.
const facilityLocales = {
  "Central District General Hospital Pharmacy": {
    ml:{name:"സെൻട്രൽ ജില്ലാ ജനറൽ ആശുപത്രി ഫാർമസി",address:"100 മെഡിക്കൽ സെന്റർ ബുലേവാർഡ്, സെൻട്രൽ ജില്ല",hours:"24/7 ഡിസ്പെൻസറി (അടിയന്തര / ഇൻപേഷ്യന്റ് / ഔട്ട്പേഷ്യന്റ് രാവിലെ 8 മുതൽ രാത്രി 8 വരെ)"},
    hi:{name:"सेंट्रल जिला सामान्य अस्पताल फार्मेसी",address:"100 मेडिकल सेंटर बुलेवार्ड, सेंट्रल जिला",hours:"24/7 डिस्पेंसरी (आपातकालीन / इनपेशेंट / आउटपेशेंट सुबह 8 बजे–रात 8 बजे)"}
  },
  "Eastside Government Polyclinic": {
    ml:{name:"ഈസ്റ്റ്സൈഡ് സർക്കാർ പോളിക്ലിനിക്",address:"73 സൺബേർഡ് ക്രസന്റ്, ഈസ്റ്റ് ജില്ല",hours:"തിങ്കൾ–വെള്ളി: രാവിലെ 8–വൈകിട്ട് 6, ശനി: രാവിലെ 8–ഉച്ചയ്ക്ക് 2"},
    hi:{name:"ईस्टसाइड सरकारी पॉलीक्लिनिक",address:"73 सनबर्ड क्रेसेंट, ईस्ट जिला",hours:"सोम–शुक्र: सुबह 8–शाम 6 बजे, शनि: सुबह 8–दोपहर 2 बजे"}
  },
  "Greenfield Urban Health Dispensary": {
    ml:{name:"ഗ്രീൻഫീൽഡ് നഗര ആരോഗ്യ ഡിസ്പെൻസറി",address:"18 ബോട്ടാണിക്കൽ ഗാർഡൻസ് വേ, ഗ്രീൻഫീൽഡ്",hours:"തിങ്കൾ–വെള്ളി: രാവിലെ 8:30–വൈകിട്ട് 5"},
    hi:{name:"ग्रीनफील्ड शहरी स्वास्थ्य डिस्पेंसरी",address:"18 बॉटनिकल गार्डन्स वे, ग्रीनफील्ड",hours:"सोम–शुक्र: सुबह 8:30–शाम 5 बजे"}
  },
  "Metro Polyclinic & Public Dispensary": {
    ml:{name:"മെട്രോ പോളിക്ലിനിക് & പബ്ലിക് ഡിസ്പെൻസറി",address:"മെട്രോ ജില്ല, ഡൗൺടൗൺ നോർത്ത്",hours:"തിങ്കൾ–വെള്ളി: രാവിലെ 8–വൈകിട്ട് 6"},
    hi:{name:"मेट्रो पॉलीक्लिनिक एवं सार्वजनिक डिस्पेंसरी",address:"मेट्रो जिला, डाउनटाउन नॉर्थ",hours:"सोम–शुक्र: सुबह 8–शाम 6 बजे"}
  },
  "North Sub-District Public Health Centre": {
    ml:{name:"നോർത്ത് സബ്-ഡിസ്ട്രിക്ട് പബ്ലിക് ഹെൽത്ത് സെന്റർ",address:"നോർത്ത് വാലി, നോർത്ത് ജില്ല",hours:"തിങ്കൾ–വെള്ളി: രാവിലെ 8–വൈകിട്ട് 5"},
    hi:{name:"नॉर्थ उप-जिला सार्वजनिक स्वास्थ्य केंद्र",address:"नॉर्थ वैली, नॉर्थ जिला",hours:"सोम–शुक्र: सुबह 8–शाम 5 बजे"}
  },
  "Victoria Memorial District Hospital": {
    ml:{name:"വിക്ടോറിയ മെമ്മോറിയൽ ജില്ലാ ആശുപത്രി",address:"സൗത്ത് ജില്ല, വിക്ടോറിയ റോഡ്",hours:"24/7 ഡിസ്പെൻസറി"},
    hi:{name:"विक्टोरिया मेमोरियल जिला अस्पताल",address:"साउथ जिला, विक्टोरिया रोड",hours:"24/7 डिस्पेंसरी"}
  },
  "Westside Community Health Centre": {
    ml:{name:"വെസ്റ്റ്സൈഡ് കമ്മ്യൂണിറ്റി ഹെൽത്ത് സെന്റർ",address:"വെസ്റ്റ് മാർക്കറ്റ്, വെസ്റ്റ് ജില്ല",hours:"തിങ്കൾ–വെള്ളി: രാവിലെ 8:30–വൈകിട്ട് 4:30"},
    hi:{name:"वेस्टसाइड सामुदायिक स्वास्थ्य केंद्र",address:"वेस्ट मार्केट, वेस्ट जिला",hours:"सोम–शुक्र: सुबह 8:30–शाम 4:30 बजे"}
  },
  "Riverside Primary Health Post & Clinic": {
    ml:{name:"റിവർസൈഡ് പ്രൈമറി ഹെൽത്ത് പോസ്റ്റ് & ക്ലിനിക്",address:"റിവർസൈഡ് സെക്ടർ, ഈസ്റ്റ് ജില്ല",hours:"തിങ്കൾ–വെള്ളി: രാവിലെ 8:30–വൈകിട്ട് 5"},
    hi:{name:"रिवरसाइड प्राथमिक स्वास्थ्य पोस्ट एवं क्लिनिक",address:"रिवरसाइड सेक्टर, ईस्ट जिला",hours:"सोम–शुक्र: सुबह 8:30–शाम 5 बजे"}
  }
};

function localizedFacility(f){
  const loc=facilityLocales[f.name]?.[currentLanguage];
  return loc ? {...f,...loc} : f;
}

// Re-render facility cards with translated names/details while preserving all existing controls.
function card(f){
  const base=f;
  const lf=localizedFacility(base);
  const emergency=base.type.includes("GENERAL") ? "24/7 EMERGENCY" : "";
  const emergencyText=currentLanguage==='ml' ? "24/7 അടിയന്തര സേവനം" : currentLanguage==='hi' ? "24/7 आपातकाल" : emergency;
  const dist=base.distanceKm!=null ? `<span class="distance-badge">⌖ ${base.distanceKm.toFixed(1)} km</span>` : `<span class="distance-badge muted">⌖ ${t('distanceUnavailable')}</span>`;
  const status=stockStatus(base);
  const freshness=base.dataHours>24 ? `<span class="freshness-badge stale">● ${t('staleData')}</span>` : `<span class="freshness-badge">● ${localizedFreshness()}</span>`;
  const medicinePart=currentSearchQuery ? `<span class="freshness-badge">${t('availabilityPrediction')}: ${status==='in'?t('likelyAvailable'):status==='low'?t('lowFilter'):t('depleted')}</span>` : '';
  return `<article class="facility-card" data-facility="${escapeHtml(base.name)}" data-status="${status}"><div class="card-top ${base.color}">${facilityTypeLabel(base.type)}<span>${emergencyText}</span></div><div class="card-body"><h3>${escapeHtml(lf.name)}</h3><p>⌖ ${escapeHtml(lf.address)}</p><p>◷ ${escapeHtml(lf.hours)}</p><p>☎ ${escapeHtml(base.phone)}</p>${dist}<div>${freshness} ${medicinePart}</div><div class="availability"><span>${t('formulary')}</span><b>${base.stock}%</b></div><i class="bar"><em style="width:${base.stock}%"></em></i><small>◉ ${base.inStock} ${t('inStockLabel')}　△ ${base.low} ${t('lowLabel')}　⊗ ${base.out} ${t('outLabel')}</small><div class="card-foot"><span>● ${t('updatedShort')}</span><div class="facility-actions"><a href="https://www.google.com/maps/search/?api=1&query=${base.lat},${base.lng}" target="_blank" rel="noopener">⌖ ${t('map')}</a><a href="https://www.google.com/maps/dir/?api=1&destination=${base.lat},${base.lng}" target="_blank" rel="noopener">➤ ${t('directions')}</a><a href="tel:${base.phone.replace(/[^+\d]/g,'')}">☎ ${t('call')}</a></div></div></div></article>`;
}

function renderOverview(){
  const grid=document.querySelector('.overview .grid'); if(!grid)return;
  const visible=facilities.slice(0,3);
  grid.innerHTML=visible.map(f=>card({...f,distanceKm:distanceFor(f),dataHours:4})).join('');
  const h=document.querySelector('.overview .section-head h2'); if(h)h.textContent=t('networkTitle');
  const p=document.querySelector('.overview .section-head p'); if(p)p.textContent=t('networkSub');
  const b=document.querySelector('.overview .section-head .outline-btn'); if(b)b.textContent=t('viewFacilities');
  const pill=document.querySelector('.overview .section-head .pill'); if(pill)pill.textContent=t('nearbyNetwork');
}

function renderFacilitiesCards(){
  const el=document.getElementById('facilities'); if(!el)return;
  let list=facilities.map(f=>({...f,distanceKm:distanceFor(f),dataHours:4}));
  if(activeStockFilter!=='all')list=list.filter(f=>stockStatus(f)===activeStockFilter);
  if(activeSort==='nearest')list.sort((a,b)=>(a.distanceKm??9999)-(b.distanceKm??9999)); else list.sort((a,b)=>b.stock-a.stock);
  el.innerHTML=list.length?list.map(card).join(''):`<div class="safety">${t('noMatches')}</div>`;
}

function initFacilities(){renderFacilityTools();renderFacilitiesCards();}

// Translate facility names/details inside Leaflet popups as well.
function updateMainMap(items){
  if(!mainMap || typeof L==='undefined') return;
  mapMarkers.forEach(m=>mainMap.removeLayer(m)); mapMarkers=[];
  if(userLocation){
    if(locationMarker) mainMap.removeLayer(locationMarker);
    locationMarker=L.marker([userLocation.lat,userLocation.lng]).addTo(mainMap).bindPopup(`<b>${t('locateMe')}</b><br>${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`);
    const bounds=L.latLngBounds([[userLocation.lat,userLocation.lng]]); items.forEach(f=>bounds.extend([f.lat,f.lng])); mainMap.fitBounds(bounds.pad(0.12));
  }
  items.forEach(f=>{
    const lf=localizedFacility(f);
    const marker=L.marker([f.lat,f.lng]).addTo(mainMap).bindPopup(`<b>${escapeHtml(lf.name)}</b><br>${escapeHtml(lf.address)}<br>${escapeHtml(lf.hours)}<br>${f.distanceKm!=null?`${t('distance')}: ${f.distanceKm.toFixed(1)} km<br>`:''}<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}">${t('directions')}</a>`);
    mapMarkers.push(marker);
  });
}

function initFacilitiesMap(){
  const el=document.getElementById('facilitiesMap'); if(!el || typeof L==='undefined') return;
  if(!facilitiesMap){
    facilitiesMap=L.map(el,{scrollWheelZoom:false}).setView([9.985,76.297],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(facilitiesMap);
  }
  mapMarkers.forEach(m=>{try{facilitiesMap.removeLayer(m)}catch(e){}});
  const bounds=[];
  facilities.forEach(f=>{
    const lf=localizedFacility(f);
    const marker=L.marker([f.lat,f.lng]).addTo(facilitiesMap).bindPopup(`<b>${escapeHtml(lf.name)}</b><br>${escapeHtml(lf.address)}<br>${escapeHtml(lf.hours)}<br>${distanceFor(f)!=null?`${t('distance')}: ${distanceFor(f).toFixed(1)} km<br>`:''}<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}">${t('directions')}</a>`);
    bounds.push([f.lat,f.lng]);
  });
  if(userLocation)bounds.push([userLocation.lat,userLocation.lng]);
  if(bounds.length)facilitiesMap.fitBounds(L.latLngBounds(bounds).pad(0.12));
  setTimeout(()=>facilitiesMap.invalidateSize(),50);
}


/* ===== Map + Distance Reliability Upgrade ===== */
function stockMarkerStatus(f){
  const s=stockStatus(f);
  return s==='in'?'in':s==='low'?'low':'out';
}
function stockMarkerIcon(status){
  const label=status==='in'?'In Stock':status==='low'?'Limited Stock':'Out of Stock';
  return L.divIcon({
    className:'medifind-stock-marker-wrap',
    html:`<span class="medifind-stock-marker ${status}" title="${label}"></span>`,
    iconSize:[22,22], iconAnchor:[11,11], popupAnchor:[0,-12]
  });
}
function mapLegendHtml(){
  return `<div class="map-stock-legend"><span><i class="legend-dot in"></i>${t('inStockLabel')}</span><span><i class="legend-dot low"></i>${t('lowLabel')}</span><span><i class="legend-dot out"></i>${t('outLabel')}</span></div>`;
}
function ensureMapLegend(mapEl){
  if(!mapEl) return;
  let legend=mapEl.parentElement?.querySelector('.map-stock-legend');
  if(!legend){
    legend=document.createElement('div');
    legend.className='map-stock-legend';
    mapEl.insertAdjacentElement('afterend',legend);
  }
  legend.outerHTML=mapLegendHtml();
}

function updateMainMap(items){
  if(!mainMap || typeof L==='undefined') return;
  mapMarkers.forEach(m=>{try{mainMap.removeLayer(m)}catch(e){}}); mapMarkers=[];
  if(locationMarker){try{mainMap.removeLayer(locationMarker)}catch(e){}}
  if(userLocation){
    locationMarker=L.circleMarker([userLocation.lat,userLocation.lng],{radius:8,weight:3,fillOpacity:.9,color:'#183b56',fillColor:'#5ba7d8'}).addTo(mainMap)
      .bindPopup(`<b>${t('locateMe')}</b><br>${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}`);
  }
  const bounds=[];
  if(userLocation) bounds.push([userLocation.lat,userLocation.lng]);
  items.forEach(f=>{
    const lf=localizedFacility(f);
    const status=stockMarkerStatus(f);
    const marker=L.marker([f.lat,f.lng],{icon:stockMarkerIcon(status)}).addTo(mainMap)
      .bindPopup(`<b>${escapeHtml(lf.name)}</b><br>${escapeHtml(lf.address)}<br><b>${status==='in'?t('inStockLabel'):status==='low'?t('lowFilter'):t('depleted')}</b><br>${f.distanceKm!=null?`${t('distance')}: ${f.distanceKm.toFixed(1)} km<br>`:`${t('distanceUnavailable')}<br>`}<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}">${t('directions')}</a>`);
    mapMarkers.push(marker); bounds.push([f.lat,f.lng]);
  });
  if(bounds.length) mainMap.fitBounds(L.latLngBounds(bounds).pad(.12));
  ensureMapLegend(document.getElementById('liveMap'));
}

function initFacilitiesMap(){
  const el=document.getElementById('facilitiesMap'); if(!el || typeof L==='undefined') return;
  if(!facilitiesMap){
    facilitiesMap=L.map(el,{scrollWheelZoom:false}).setView([9.985,76.297],13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(facilitiesMap);
  }
  facilitiesMap.eachLayer(layer=>{
    if(layer instanceof L.Marker) facilitiesMap.removeLayer(layer);
  });
  const bounds=[];
  facilities.forEach(f=>{
    const lf=localizedFacility(f), status=stockMarkerStatus(f);
    const marker=L.marker([f.lat,f.lng],{icon:stockMarkerIcon(status)}).addTo(facilitiesMap)
      .bindPopup(`<b>${escapeHtml(lf.name)}</b><br>${escapeHtml(lf.address)}<br>${escapeHtml(lf.hours)}<br><b>${status==='in'?t('inStockLabel'):status==='low'?t('lowFilter'):t('depleted')}</b><br>${distanceFor(f)!=null?`${t('distance')}: ${distanceFor(f).toFixed(1)} km<br>`:`${t('distanceUnavailable')}<br>`}<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lng}">${t('directions')}</a>`);
    bounds.push([f.lat,f.lng]);
  });
  if(userLocation) bounds.push([userLocation.lat,userLocation.lng]);
  if(userLocation){
    L.circleMarker([userLocation.lat,userLocation.lng],{radius:8,weight:3,fillOpacity:.9,color:'#183b56',fillColor:'#5ba7d8'}).addTo(facilitiesMap).bindPopup(`<b>${t('locateMe')}</b>`);
  }
  if(bounds.length) facilitiesMap.fitBounds(L.latLngBounds(bounds).pad(.12));
  ensureMapLegend(el);
  setTimeout(()=>facilitiesMap.invalidateSize(),100);
}

function requestLiveLocation(){
  if(!window.isSecureContext && location.hostname!=='localhost' && location.hostname!=='127.0.0.1'){
    showLocationMessage('denied');
    return;
  }
  if(!navigator.geolocation){showLocationMessage('denied');return;}
  const btn=document.getElementById('locateBtn'); if(btn) btn.textContent=t('locating');
  navigator.geolocation.getCurrentPosition(pos=>{
    userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};
    localStorage.setItem('medifindLastLocation',JSON.stringify(userLocation));
    if(btn) btn.textContent=t('locationReady');
    initFacilities();
    if(document.getElementById('results') && !document.getElementById('results').classList.contains('hidden')) renderSearchCards();
    if(document.getElementById('liveMap')){initMainMap(); updateMainMap(currentSearchQuery?facilities.map((f,i)=>{const c={...f};const s=statusForFacility(f,i,profileFor(currentSearchQuery));c.inStock=s==='in'?1:0;c.low=s==='low'?1:0;c.out=s==='out'?1:0;c.stock=s==='in'?100:s==='low'?45:0;c.distanceKm=distanceFor(c);return c;}):facilities.map(f=>({...f,distanceKm:distanceFor(f)})));}
    if(document.getElementById('facilitiesMap')) initFacilitiesMap();
  },()=>{
    if(btn) btn.textContent=t('locateMe');
    showLocationMessage('denied');
  },{enableHighAccuracy:true,timeout:20000,maximumAge:30000});
}

function init(){
  loadSavedLocation();
  const select=document.getElementById('language');
  if(select){select.value=currentLanguage;select.addEventListener('change',e=>applyLanguage(e.target.value));}
  initFacilities();initEquiv();initAudit();setupSearchListener();setupLocationButton();applyLanguage(currentLanguage);
  if(document.getElementById('liveMap')) initMainMap();
  if(document.getElementById('facilitiesMap')) initFacilitiesMap();
  if(!userLocation) setTimeout(()=>requestLiveLocation(),700);
}
