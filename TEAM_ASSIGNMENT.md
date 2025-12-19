# Phân Chia Công Việc Dự Án (Team 2 Người)

Tài liệu này gợi ý cách chia phần để 2 thành viên cùng học và phát triển dự án Social Media này một cách hiệu quả, đảm bảo cả hai đều nắm được Full-stack (Giao diện + Logic).

---

## 📅 Tổng Quan
- **Dự án:** Ứng dụng Mạng Xã Hội (Clone Instagram)
- **Công nghệ chính:** React Native, TypeScript, Firebase (Firestore, Auth, Storage).
- **Mục tiêu:** Mỗi người phụ trách trọn vẹn các tính năng từ A-Z (Giao diện -> Logic -> Cơ sở dữ liệu).

---

## 👤 Thành Viên 1: Core User & Social (Người dụng & Tương tác)
**Trọng tâm:** Quản lý định danh, kết nối giữa người dùng và giao tiếp thời gian thực.

### Các Module Phụ Trách:
1.  **Authentication (Xác thực)**
    -   Màn hình Login, Signup.
    -   Xử lý Đăng ký/Đăng nhập với Firebase Auth.
    -   Quản lý phiên đăng nhập (Zustand Auth Store).

2.  **Profile System (Hồ sơ người dùng)**
    -   Màn hình trang cá nhân (`ProfileScreen`).
    -   Màn hình chỉnh sửa hồ sơ (`EditProfileScreen`).
    -   **Logic khó:** Đồng bộ dữ liệu người dùng toàn app (như lỗi mình vừa fix), xử lý đổi avatar/tên.

3.  **Social Graph (Follow/Unfollow)**
    -   Tính năng Follow/Unfollow.
    -   Danh sách Followers/Following (`UserListScreen`).
    -   Xử lý logic cập nhật nút Follow (Optimistic Update).

4.  **Chat System (Nhắn tin)**
    -   Danh sách đoạn chat (`ChatListScreen`).
    -   Màn hình chat chi tiết (`ChatRoomScreen`).
    -   Gửi ảnh, tin nhắn realtime.

5.  **Search (Tìm kiếm)**
    -   Tìm kiếm người dùng theo tên (`SearchScreen`).

---

## 🎥 Thành Viên 2: Content & Media (Nội dung & Đa phương tiện)
**Trọng tâm:** Hiển thị nội dung, xử lý media (ảnh, video) và tương tác với nội dung.

### Các Module Phụ Trách:
1.  **Home Feed (Bảng tin)**
    -   Màn hình trang chủ (`HomeScreen`).
    -   Component hiển thị bài viết (`PostItem`).
    -   Tính năng: Like, Save Post.

2.  **Post Creation (Đăng bài)**
    -   Chọn ảnh từ thư viện.
    -   Upload ảnh lên Cloudinary/Firebase.
    -   Viết caption và lưu vào Firestore.

3.  **Stories (Tin 24h)**
    -   Thanh Story (`StoryBar`).
    -   Trình xem Story (`StoryViewer`).
    -   Logic: Tự động xóa sau 24h, upload ảnh story (crop, resize).

4.  **Reels (Video ngắn)**
    -   Màn hình Reels (lướt dọc như TikTok).
    -   Upload và phát video.
    -   Xử lý tạm dừng/phát khi lướt.

5.  **Comments & Notifications (Bình luận & Thông báo)**
    -   Hệ thống bình luận (bao gồm cả Reply/Tag @username).
    -   Màn hình thông báo (`ActivityScreen`) khi có like/comment mới.

---

## 🤝 Quy Trình Làm Việc Chung (Git Workflow)
Để tránh xung đột code (conflict), hai bạn nên tuân thủ:

1.  **Tạo Nhánh (Branch):**
    -   Người 1: `feature/user-profile`, `feature/chat`
    -   Người 2: `feature/home-feed`, `feature/reels`
2.  **Common Files (File dùng chung):**
    -   Nếu cần sửa `types/index.ts` hoặc `firebaseConfig.ts`, hãy thông báo cho nhau trước.
    -   Hạn chế sửa trực tiếp vào file của người kia đang làm.
3.  **Review:**
    -   Cuối ngày merge code vào nhánh `main` chung.

---

## 🚀 Lộ Trình Gợi Ý
-   **Tuần 1:**
    -   Người 1: Dựng khung Login/Signup + Cấu hình Firebase.
    -   Người 2: Dựng khung Home Feed + Post UI (dữ liệu giả).
-   **Tuần 2:**
    -   Người 1: Làm xong Profile + Edit Profile.
    -   Người 2: Làm tính năng Đăng bài (Upload ảnh thật) + Like/Comment.
-   **Tuần 3:**
    -   Người 1: Làm Chat Realtime.
    -   Người 2: Làm Reels & Stories.
-   **Tuần 4:** Fix lỗi, tối ưu hiệu năng (như bài toán nút Follow, Data Consistency).
