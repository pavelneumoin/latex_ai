const PAGES = ["/create", "/templates", "/upload", "/my", "/share", "/demo", "/check", "/check-text", "/marketplace", "/cabinet/classes", "/cabinet/checks", "/cabinet/reports"];
const APIS = ["/api/worksheets", "/api/generate", "/api/upload", "/api/uploads", "/api/check", "/api/check-text", "/api/checks", "/api/classes", "/api/reports", "/api/bank", "/api/templates", "/api/pdf", "/api/bestlist", "/api/marketplace"];
export function isUnderDevelopment(path:string){return [...PAGES,...APIS].some(prefix=>path===prefix||path.startsWith(prefix+"/"));}
