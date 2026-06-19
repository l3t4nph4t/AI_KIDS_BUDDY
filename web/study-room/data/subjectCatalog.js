/**
 * subjectCatalog.js — Môn học
 * Each subject is a "book" on the study desk.
 */
window.SUBJECT_CATALOG = [
  {
    id: 'math',
    label: 'Toán',
    iconType: '🔢',
    color: '#4DA3FF',
    bgColor: '#E3F2FD',
    route: 'learn',
    shortDescription: 'Số đếm, cộng trừ, hình học',
    lessons: 24,
    progress: 8
  },
  {
    id: 'tieng_viet',
    label: 'Tiếng Việt',
    iconType: '📖',
    color: '#FF8FAB',
    bgColor: '#FCE4EC',
    route: 'learn',
    shortDescription: 'Chữ cái, đọc hiểu, chính tả',
    lessons: 20,
    progress: 5
  },
  {
    id: 'music',
    label: 'Âm nhạc',
    iconType: '🎵',
    color: '#CE93D8',
    bgColor: '#F3E5F5',
    route: 'learn',
    shortDescription: 'Nốt nhạc, nhịp điệu, bài hát',
    lessons: 12,
    progress: 3
  },
  {
    id: 'art',
    label: 'Mĩ thuật',
    iconType: '🎨',
    color: '#FFB74D',
    bgColor: '#FFF3E0',
    route: 'learn',
    shortDescription: 'Tô màu, vẽ tranh, cắt dán',
    lessons: 15,
    progress: 4
  },
  {
    id: 'reading',
    label: 'Đọc sách',
    iconType: '📚',
    color: '#81C784',
    bgColor: '#E8F5E9',
    route: 'learn',
    shortDescription: 'Truyện, thơ, sách ảnh',
    lessons: 18,
    progress: 6
  }
];
