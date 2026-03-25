export type PageType = 'home' | 'console' | 'monitoring' | 'analysis' | 'comparison' | 'history' | 'team';

export interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
  color: string;
}

export interface TechStackItem {
  name: string;
  description: string;
  icon: string;
  color: string;
}
