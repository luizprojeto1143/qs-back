export interface Quiz {
    id: string;
    title: string;
}

export interface Lesson {
    id: string;
    title: string;
    duration: number;
    videoUrl: string;
    attachments: { name: string; url: string; type: string }[];
}

export interface Module {
    id: string;
    title: string;
    order: number;
    lessons: Lesson[];
    quizzes: Quiz[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
    active: boolean;
    isMandatory: boolean;
    publishedAt: string | null;
    modules: Module[];
    visibleToAll?: boolean; // Propriedade opcional se não vier sempre do backend
}
