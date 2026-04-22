export interface TextItem {
  id: string
  title: string
  content: string
  category: string
}

export const SEED_TEXTS: TextItem[] = [
  {
    id: 'soldier-creed',
    title: "Soldier's Creed",
    content:
      'I am an American Soldier. I am a warrior and a member of a team. I serve the people of the United States, and live the Army Values. I will always place the mission first. I will never accept defeat. I will never quit. I will never leave a fallen comrade. I am disciplined, physically and mentally tough, trained and proficient in my warrior tasks and drills. I always maintain my arms, my equipment and myself. I am an expert and I am a professional. I stand ready to deploy, engage, and destroy, the enemies of the United States of America in close combat. I am a guardian of freedom and the American way of life. I am an American Soldier.',
    category: 'military',
  },
  {
    id: 'nco-creed',
    title: 'NCO Creed',
    content:
      'No one is more professional than I. I am a noncommissioned officer, a leader of Soldiers. As a noncommissioned officer, I realize that I am a member of a time honored corps, which is known as "The Backbone of the Army." I am proud of the Corps of Noncommissioned Officers and will at all times conduct myself so as to bring credit upon the Corps, the military service and my country regardless of the situation in which I find myself.',
    category: 'military',
  },
  {
    id: 'gettysburg-opening',
    title: 'Gettysburg Address (Opening)',
    content:
      'Four score and seven years ago our fathers brought forth on this continent, a new nation, conceived in Liberty, and dedicated to the proposition that all men are created equal. Now we are engaged in a great civil war, testing whether that nation, or any nation so conceived and so dedicated, can long endure.',
    category: 'historical',
  },
  {
    id: 'i-have-a-dream',
    title: 'I Have a Dream (Excerpt)',
    content:
      'I have a dream that one day this nation will rise up and live out the true meaning of its creed: We hold these truths to be self-evident, that all men are created equal. I have a dream that one day on the red hills of Georgia, the sons of former slaves and the sons of former slave owners will be able to sit down together at the table of brotherhood.',
    category: 'historical',
  },
  {
    id: 'public-speaking',
    title: 'The Art of Public Speaking',
    content:
      'Public speaking is not just about delivering words to an audience. It is about connecting with people, sharing ideas that matter, and inspiring action through authentic communication. The best speakers understand that confidence comes from preparation, practice, and genuine passion for their message.',
    category: 'practice',
  },
]
