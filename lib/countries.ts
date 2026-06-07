export const countryCodes = [
"US","AF","AL","DZ","AD","AO","AG","AR","AM","AU","AT","AZ",
"BS","BH","BD","BB","BY","BE","BZ","BJ","BM","BT","BO","BA","BW","BR",
"BN","BG","BF","BI","CV","KH","CM","CA","CF","TD","CL","CN",
"CO","KM","CG","CD","CR","CI","HR","CU","CY","CZ","DK","DJ","DM","DO",
"EC","EG","SV","GQ","ER","EE","SZ","ET","FJ","FI","FR","GF",
"GA","GM","GE","DE","GH","GR","GL","GD","GU","GT","GN","GW","GY",
"HT","VA","HN","HK","HU","IS","IN","ID","IR","IQ","IE","IM","IL","IT","JM",
"JP","JO","KZ","KE","KI","KP","KR","KW","KG","LA","LV","LB","LS","LR","LY",
"LI","LT","LU","MO","MG","MW","MY","MV","ML","MT","MH","MR","MU","MX",
"FM","MD","MC","MN","ME","MA","MZ","MM","NA","NR","NP","NL","NZ","NI",
"NE","NG","MK","NO","OM","PK","PW","PS","PA","PG","PY","PE","PH",
"PL","PT","PR","QA","RO","RU","RW","KN","LC","VC","WS","SM","ST","SA",
"SN","RS","SC","SL","SG","SK","SI","SB","SO","ZA","SS","ES","LK","SD","SR",
"SE","CH","SY","TW","TJ","TZ","TH","TL","TG","TO","TT","TN","TR","TM",
"TV","UG","UA","AE","GB","UY","UZ","VU","VE","VN","VG","VI","EH","YE","ZM","ZW"
]

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

export const countries = countryCodes
  .map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    flagUrl: `https://flagcdn.com/w40/${code.toLowerCase()}.png`,
  }))
  .sort((a, b) => {
  if (a.code === "US") return -1
  if (b.code === "US") return 1

  return a.name.localeCompare(b.name)
})