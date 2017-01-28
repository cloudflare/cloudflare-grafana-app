var metricList = [
  {text: 'Query count', value: 'queryCount' },
  {text: 'Stale count', value: 'staleCount' },
  {text: 'Uncached count', value: 'uncachedCount' },
  {text: 'Average response time', value: 'responseTimeAvg' },
  {text: 'Median response time', value: 'responseTimeMedian' },
  {text: '90th percentile response time', value: 'responseTime90th' },
  {text: '99th percentile response time', value: 'responseTime99th' }
];

var dimensionList = [
  {text: 'Query Name',      value: 'queryName'},
  {text: 'Query Type',      value: 'queryType'},
  {text: 'Response Code',   value: 'responseCode'},
  {text: 'Response Cached', value: 'responseCached'},
  {text: 'Colo Name',       value: 'coloName'},
  {text: 'Origin NS',       value: 'origin'}
];

/* Convert from interval value to per-second */
function toPps(p, from, to) {
  return p / ((to - from) / 1000 + 1);
}

var unitList = {
  queryCount: { transform: toPps },
  staleCount: { transform: toPps },
  uncachedCount: { transform: toPps }
}

var dimensionValues = {
  queryName: ['example.com'],
  queryType: ['A','AAAA','AFSDB','APL','CAA','CDNSKEY','CDS','CERT','CNAME','DHCID','DLV','DNSKEY','DS','IPSECKEY','KEY','KX','LOC','MX','NAPTR','NS','NSEC','NSEC3','NSEC3PARAM','PTR','RRSIG','RP','SIG','SOA','SRV','SSHFP','TA','TKEY','TLSA','TSIG','TXT'],
  responseCode: ['NOERROR','FORMERR','SERVFAIL','NXDOMAIN','NOTIMPL','REFUSED'],
  responseCached: ['uncached', 'cached'],
  coloName: ['IAD','ATL','BNA','BOS','ORD','DFW','DEN','MCI','LAS','LAX','MIA','MSP','YUL','EWR','OMA','PTY','PHL','PHX','PDX','SFO','SFO','SJC','SEA','STL','TPA','YYZ','YVR','AMS','ATH','BCN','BRU','BEG','TXL','OTP','CPH','DUB','DUS','FRA','HAM','HEL','KBP','LIS','LHR','MAD','MAN','MRS','MUC','MXP','DME','OSL','CDG','PRG','SOF','ARN','VIE','WAW','ZRH','AKL','BNE','MEL','PER','SYD','MAA','HKG','TPE','KUL','BOM','DEL','KIX','ICN','SIN','NRT','MNL','MNL','BKK','BKK','EVN','EZE','LIM','MDE','SCL','SCL','GRU','CUR','CAI','JNB','LAD','JIB','MBA','DOH','DXB','KWI','MCT','CTU','SZX','FOC','CAN','CAN','HGH','HNY','NAY','LYA','TAO','TAO','SHE','TSN','XIY','XIY','SJW','CGO','NNG','FUO','SZV','TNA','WUH','WUX','CSX','SHA','SHA','NBG','SHA','CKG','TSN'],
  origin: ['2001:db8::cf', '203.0.113.1'],
}


export {metricList, dimensionList, unitList, dimensionValues};
