export type Role='user'|'developer'|'company'|'admin';
export type Difficulty='beginner'|'intermediate'|'advanced'|'expert';
export type Status='open'|'solved'|'closed';
export type Profile={id:string;display_name:string;username:string;role:Role;bio:string|null;reputation:number;problems_solved:number;solutions_accepted:number;avatar_url:string|null};
export type Problem={id:string;title:string;description:string;difficulty:Difficulty;status:Status;created_at:string;views:number;solution_count:number;author_id:string;accepted_solution_id:string|null;author?:Profile;tags?:string[]};
export type Solution={id:string;problem_id:string;author_id:string;body:string;created_at:string;updated_at:string;is_accepted:boolean;author?:Profile};
