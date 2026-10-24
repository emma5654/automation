export const CONSENT_KEY='studio-cookie-choice-v1';
export type CookieChoice={version:string;at:number;analytics:boolean};
export function validChoice(value:unknown,version:string,now=Date.now()):value is CookieChoice{
 if(!value||typeof value!=='object')return false;const v=value as Partial<CookieChoice>;
 return v.version===version&&typeof v.analytics==='boolean'&&typeof v.at==='number'&&v.at<=now&&now-v.at<180*86400000;
}
export function analyticsSection(pathname:string){const parts=pathname.split('/').filter(Boolean);if(parts[0]==='projects'&&parts[1]&&parts[1]!=='new'){const allowed=['diagnosis','architecture','guided-images','tutorial','tests','pricing','security'];return 'project_'+(allowed.includes(parts[2])?parts[2]:'overview');}return ['dashboard','projects','clients','messages','maintenance','skills','pricing','settings','compliance','legal'].includes(parts[0])?parts[0]:'dashboard';}
