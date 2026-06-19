/**
 * vyvyCatalog.js — VyVy character states and speech.
 */
window.VYVY_CATALOG = {
  states: {
    idle: { label: 'Nghỉ ngơi', poseClass: 'pose-idle', speechText: 'Chào bạn! Mình học nhé?' },
    happy: { label: 'Vui vẻ', poseClass: 'pose-happy', speechText: 'Tuyệt vời! Bạn giỏi quá!' },
    thinking: { label: 'Suy nghĩ', poseClass: 'pose-thinking', speechText: 'Hmm, để mình nghĩ...' },
    excited: { label: 'Hào hứng', poseClass: 'pose-excited', speechText: 'Yeah! Mình thích lắm!' },
    encouraging: { label: 'Khuyến khích', poseClass: 'pose-encouraging', speechText: 'Cố lên nhé! Bạn làm được mà!' },
    studying: { label: 'Học bài', poseClass: 'pose-studying', speechText: 'Mình đang đọc sách nè!' },
    shopping: { label: 'Mua sắm', poseClass: 'pose-shopping', speechText: 'Ooh, đẹp quá! Mua nha!' },
    sleeping: { label: 'Ngủ', poseClass: 'pose-sleeping', speechText: 'Zzz...' }
  },
  greetings: [
    'Chào buổi sáng, {name}! Hôm nay mình học gì nè?',
    'Chào {name}! VyVy nhớ bạn quá!',
    'Hey {name}! Mình chuẩn bị bài học vui cho bạn nè!',
    'Chào {name}! Bạn đã sẵn sàng học chưa?'
  ],
  encouragements: [
    'Bạn giỏi quá!',
    'Tuyệt vời!',
    'Làm tốt lắm!',
    'Tiếp tục nhé!',
    'VyVy tự hào về bạn!'
  ]
};
