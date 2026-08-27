import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client.js";
import env from "../src/config/env.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) });

const TARGET_TOPIC_ID = "mct3hi2h0075bolicm63xey4";

type Block = { type: string; content?: unknown; props?: Record<string, unknown> };

function paragraph(content: string): Block {
  return { type: "paragraph", content };
}

function heading(content: string): Block {
  return { type: "heading", content, props: { level: 2 } };
}

function bullet(content: string): Block {
  return { type: "bulletListItem", content };
}

function numbered(content: string): Block {
  return { type: "numberedListItem", content };
}

function quote(content: string): Block {
  return { type: "quote", content };
}

function image(seed: string, caption: string): Block {
  return {
    type: "image",
    props: { url: `https://picsum.photos/seed/${seed}/900/480`, caption },
  };
}

function generateBodyBlocks(index: number, title: string, intro: string): Block[] {
  const sections: string[] = [
    ["Giới thiệu", "Chi tiết", "Kết luận"],
    ["Bối cảnh", "Phân tích", "Gợi ý"],
    ["Mở đầu", "Nội dung chính", "Tóm tắt"],
    ["Tại sao quan trọng", "Cách thực hiện", "Lưu ý"],
    ["Câu chuyện", "Bài học", "Hướng đi"],
  ][index % 5] ?? ["Giới thiệu", "Chi tiết", "Kết luận"];

  const [s1, s2, s3] = sections;

  return [
    paragraph(intro),
    heading(s1!),
    paragraph("Trước khi đi vào chi tiết, chúng ta cần hiểu rõ bối cảnh và lý do tại sao chủ đề này lại đáng chú ý."),
    bullet("Nhu cầu thực tế từ cộng đồng người đọc"),
    bullet("Kinh nghiệm được đúc kết từ nhiều nguồn đáng tin cậy"),
    bullet("Áp dụng được ngay vào đời sống hàng ngày"),
    image(`topic-${index}-a`, "Hình minh họa cho phần giới thiệu"),
    heading(s2!),
    numbered("Xác định mục tiêu rõ ràng trước khi bắt đầu"),
    numbered("Thực hiện từng bước nhỏ, đều đặn mỗi ngày"),
    numbered("Theo dõi tiến độ và điều chỉnh khi cần"),
    paragraph("Việc thực hiện từng bước như trên không đòi hỏi nỗ lực quá lớn — chỉ cần bạn duy trì đều đặn trong vài tuần đầu."),
    heading(s3!),
    quote("Hành trình vạn dặm bắt đầu từ một bước chân nhỏ. Hãy bắt đầu ngay hôm nay."),
    paragraph("Sau khi áp dụng, bạn sẽ thấy sự thay đổi rõ rệt. Đừng quên chia sẻ trải nghiệm của bạn để cộng đồng cùng học hỏi!"),
    image(`topic-${index}-b`, "Kết quả sau khi áp dụng"),
  ];
}

async function main() {
  console.log(`[seed-topic] Checking topic ${TARGET_TOPIC_ID}...`);

  let topic = await prisma.topic.findUnique({
    where: { id: TARGET_TOPIC_ID },
    select: { id: true, name: true, description: true },
  });

  if (!topic) {
    console.log(`[seed-topic] Topic ${TARGET_TOPIC_ID} not found. Creating new topic...`);
    topic = await prisma.topic.create({
      data: {
        id: TARGET_TOPIC_ID,
        name: "Chủ đề mới",
        description: "Chủ đề được tạo tự động bởi script seed.",
      },
      select: { id: true, name: true, description: true },
    });
    console.log(`[seed-topic] Created topic: ${topic.name} (${topic.id})`);
  } else {
    console.log(`[seed-topic] Found topic: ${topic.name}`);
  }

  const existingCount = await prisma.post.count({
    where: { topics: { some: { id: TARGET_TOPIC_ID } } },
  });
  console.log(`[seed-topic] Current posts for this topic: ${existingCount}`);

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (!admin) {
    console.error("[seed-topic] No admin user found!");
    process.exitCode = 1;
    return;
  }

  const authors = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true },
  });

  const allAuthors = [admin.id, ...authors.map((a) => a.id)];

  const tags = await prisma.tag.findMany({
    select: { id: true, name: true },
  });

  const tagIds = tags.map((t) => t.id);

  const sections = await prisma.section.findMany({
    select: { id: true, slug: true },
  });

  console.log("[seed-topic] Creating 120 posts...");

  const postTitles = [
    "Cách quản lý thời gian hiệu quả cho người bận rộn",
    "Mẹo tiết kiệm điện mùa nắng nóng",
    "Bí quyết giữ nhà luôn gọn gàng mỗi ngày",
    "Thói quen buổi sáng giúp tăng năng suất làm việc",
    "Cách nấu các món chay đơn giản mà đủ dinh dưỡng",
    "Kinh nghiệm thuê nhà trọ lần đầu cho sinh viên",
    "Mẹo phối đồ công sở thanh lịch nhưng thoải mái",
    "Cách trồng rau sạch trên ban công nhà phố",
    "Bài tập yoga 15 phút mỗi sáng cho sức khỏe",
    "Phương pháp đọc sách nhanh mà vẫn nhớ lâu",
    "Cách tiết kiệm 30% chi tiêu hàng tháng",
    "Mẹo bảo quản thực phẩm tươi lâu hơn",
    "Lịch trình du lịch bụi Đà Lạt 2 ngày 1 đêm",
    "Cách pha cà phê ngon tại nhà không cần máy",
    "Thói quen giúp cải thiện giấc ngủ tự nhiên",
    "Mẹo dọn dẹp nhà cửa nhanh gọn trong 30 phút",
    "Cách học ngoại ngữ hiệu quả cho người đi làm",
    "Kinh nghiệm nuôi mèo lần đầu cần biết",
    "Bí quyết giữ lửa passion khi làm việc từ xa",
    "Mẹo chọn giày đi làm thoải mái mà thời trang",
    "Cách làm bữa sáng healthy chỉ trong 10 phút",
    "Phương pháp thiền định cho người mới bắt đầu",
    "Mẹo tiết kiệm tiền khi đi siêu thị",
    "Kinh nghiệm đi phượt Sapa tự túc tiết kiệm",
    "Cách sắp xếp tủ đồ tối giản hiệu quả",
    "Thói quen giúp tăng cường sức khỏe tinh thần",
    "Mẹo làm sạch nhà bếp sau mỗi bữa ăn",
    "Cách lập kế hoạch tài chính cá nhân",
    "Bài tập thể dục tại nhà không cần dụng cụ",
    "Mẹo chọn sách hay để đọc mỗi tuần",
    "Cách nấu bữa cơm gia đình ấm cúng",
    "Kinh nghiệm sống một mình an toàn và vui vẻ",
    "Mẹo phối màu trang phục công sở",
    "Cách làm đồ handmade từ vật liệu tái chế",
    "Thói quen giúp giảm stress hiệu quả",
    "Mẹo tiết kiệm thời gian khi nấu ăn",
    "Kinh nghiệm đi du lịch châu Âu tiết kiệm",
    "Cách chăm sóc da mặt tự nhiên tại nhà",
    "Bài tập gym tại nhà cho người mới bắt đầu",
    "Mẹo chọn mua nội thất cho căn hộ nhỏ",
    "C cách viết nhật ký sáng tạo mỗi ngày",
    "Thói quen giúp提高 concentration khi làm việc",
    "Mẹo làm bữa trưa văn phòng ngon và đủ chất",
    "Kinh nghiệm nuôi chó con lần đầu",
    "Cách tiết kiệm tiền mua nhà trong 5 năm",
    "Bài tập Pilates cho dân văn phòng",
    "Mẹo trang trí phòng ngủ nhỏ xinh",
    "Cách làm sữa hạt tại nhà thơm ngon",
    "Thói quen buổi tối giúp sáng mai tỉnh táo",
    "Kinh nghiệm đi phượt Quảng Bình tự túc",
    "Mẹo chọn kem chống nắng phù hợp",
    "Cách làm bánh mì tại nhà đơn giản",
    "Phương pháp quản lý email hiệu quả",
    "Mẹo tiết kiệm nước trong sinh hoạt hàng ngày",
    "Kinh nghiệm đi du lịch Nhật Bản tự túc",
    "C cách chăm sóc cây cảnh ban công",
    "Bài tập streching cho người ngồi nhiều",
    "Mẹo chọn thực phẩm hữu cơ an toàn",
    "Cách làm món tráng miệng healthy",
    "Thói quen giúp cải thiện tư duy sáng tạo",
    "Kinh nghiệm đi phượt Phú Quốc tiết kiệm",
    "Mẹo phối đồ dạo phố phong cách",
    "C cách làm nước ép detox tại nhà",
    "Phương pháp đọc sách online hiệu quả",
    "Mẹo tiết kiệm khi mua sắm online",
    "Kinh nghiệm nuôi mèo con 2 tháng tuổi",
    "Cách làm đồ trang trí sinh nhật tại nhà",
    "Bài tập plank mỗi ngày cho bụng phẳng",
    "Mẹo chọn quán cà phê làm việc yên tĩnh",
    "Cách làm bữa sáng nhanh cho người đi làm",
    "Thói quen giúp tăng cường sức đề kháng",
    "Kinh nghiệm đi du lịch Bali tự túc",
    "Mẹo sắp xếp bàn làm việc gọn gàng",
    "C cách làm kem yogurt tại nhà",
    "Phương pháp học lập trình cho người mới",
    "Mẹo tiết kiệm tiền khi đi du lịch",
    "Kinh nghiệm sống ở nước ngoài lần đầu",
    "C cách làm面膜 tự nhiên từ nguyên liệu có sẵn",
    "Bài tập cardio tại nhà đốt cháy calo",
    "Mẹo chọn đồ dùng nhà bếp thông minh",
    "Cách làm bữa tối healthy chỉ 30 phút",
    "Thói quen giúp cải thiện kỹ năng giao tiếp",
    "Kinh nghiệm đi phượt Nha Trang tự túc",
    "Mẹo phối đồ đông ấm áp mà thời trang",
    "C cách làm nước mắm tại nhà",
    "Phương pháp quản lý dự án cá nhân",
    "Mẹo tiết kiệm tiền khi mua xe máy",
    "Kinh nghiệm đi du lịch Hàn Quốc tự túc",
    "C cách làm đèn trang trí từ chai nhựa",
    "Bài tập跑步 mỗi sáng cho sức khỏe",
    "Mẹo chọn laptop phù hợp cho dân văn phòng",
    "Cách làm bữa sáng kiểu Nhật đơn giản",
    "Thói quen giúp提高效率 làm việc nhóm",
    "Kinh nghiệm đi phượt Hà Giang tự túc",
    "Mẹo sắp xếp tủ lạnh tiết kiệm không gian",
    "C cách làm xà phòng手工 tại nhà",
    "Phương pháp học tiếng Anh giao tiếp",
    "Mẹo tiết kiệm tiền khi sửa nhà",
    "Kinh nghiệm đi du lịch Thái Lan tự túc",
    "C cách làm nến thơm tại nhà",
    "Bài tập squat mỗi ngày cho vòng 3 săn chắc",
    "Mẹo chọn máy lọc nước gia đình",
    "Cách làm bữa trưa văn phòng healthy",
    "Thói quen giúp cải thiện trí nhớ",
    "Kinh nghiệm đi phượt Mộc Châu tự túc",
    "Mẹo phối đồ đi chơi cuối tuần",
    "C cách làm giấm táo tại nhà",
    "Phương pháp học IELTS hiệu quả",
    "Mẹo tiết kiệm tiền khi đi ăn ngoài",
    "Kinh nghiệm đi du lịch Singapore tự túc",
    "C cách làm tranh treo tường từ vải thừa",
    "Bài tập yoga buổi tối giúp ngủ ngon",
    "Mẹo chọn tai nghe tốt cho dân văn phòng",
    "Cách làm bữa sáng kiểu Hàn Quốc",
    "Thói quen giúp提高 creativity khi làm việc",
    "Kinh nghiệm đi phượt Cát Bà tự túc",
    "Mẹo sắp xếp giày dép gọn gàng",
    "C cách làm nước rửa chén tự nhiên",
    "Phương pháp học toán online hiệu quả",
    "Mẹo tiết kiệm tiền khi mua xe ô tô",
    "Kinh nghiệm đi du lịch châu Âu tiết kiệm",
    "C cách làm lọ hoa từ chai nhựa tái chế",
    "Bài tập Pilates mỗi sáng cho thân hình dẻo",
  ];

  const postIntros = [
    "Cuộc sống hiện đại đòi hỏi chúng ta phải biết cách quản lý thời gian và_prioritize công việc một cách khoa học.",
    "Trong thời tiết nắng nóng, việc tiết kiệm điện không chỉ giúp giảm chi phí mà còn bảo vệ môi trường.",
    "Một ngôi nhà gọn gàng không chỉ tạo cảm giác thoải mái mà còn giúp提高 năng suất làm việc.",
    "Bắt đầu ngày mới với những thói quen đúng cách sẽ giúp bạn có năng lượng dồi dào cả ngày.",
    "Món chay không chỉ tốt cho sức khỏe mà còn giúp bảo vệ môi trường hiệu quả.",
    "Đây là bài viết chia sẻ kinh nghiệm thực tế từ những người đã từng trải qua.",
    "Phối đồ công sở không khó, quan trọng là biết cách kết hợp màu sắc và chất liệu.",
    "Trồng rau tại nhà giúp bạn có thực phẩm sạch và tiết kiệm chi phí mua rau hàng ngày.",
    "Yoga giúp cải thiện sức khỏe thể chất và tinh thần hiệu quả nếu duy trì đều đặn.",
    "Đọc sách là thói quen tốt, nhưng đọc đúng cách mới giúp bạn ghi nhớ lâu.",
    "Tiết kiệm tiền không có nghĩa là sống thiếu thốn, mà là tiêu tiền thông minh.",
    "Bảo quản thực phẩm đúng cách giúp bạn tiết kiệm tiền và đảm bảo vệ sinh an toàn.",
    "Đà Lạt là điểm đến lý tưởng cho những chuyến đi ngắn ngày cuối tuần.",
    "Cà phê tại nhà không chỉ tiết kiệm mà còn giúp bạn thưởng thức theo sở thích riêng.",
    "Giấc ngủ chất lượng là yếu tố quan trọng nhất cho sức khỏe mỗi ngày.",
    "Dọn nhà không cần nhiều thời gian nếu bạn có phương pháp đúng.",
    "Học ngoại ngữ cần sự kiên trì và phương pháp đúng đắn.",
    "Nuôi mèo cần sự chuẩn bị kỹ lưỡng từ A đến Z.",
    "Làm việc từ xa cần kỷ luật bản thân và tạo động lực liên tục.",
    "Chọn giày đúng cách giúp bạn thoải mái suốt 8 tiếng làm việc.",
  ];

  const postsToCreate = 120;
  const createdPostIds: string[] = [];

  for (let i = 0; i < postsToCreate; i++) {
    const titleIndex = i % postTitles.length;
    const introIndex = i % postIntros.length;
    const title = `${postTitles[titleIndex]} — Phần ${i + 1}`;
    const intro = postIntros[introIndex];

    const slugBase = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const daysAgo = 1 + (i % 90);
    const createdDate = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    const authorId = allAuthors[i % allAuthors.length];
    const sectionId = sections[i % sections.length]?.id ?? null;

    const post = await prisma.post.create({
      data: {
        title,
        slug: `${slugBase}-${(i + 1000).toString(36)}`,
        excerpt: `${title} — bài viết chi tiết từ cộng đồng.`,
        cover: `https://picsum.photos/seed/topic-post-${i + 1}/1280/670`,
        bodyBlocks: generateBodyBlocks(i, title, intro) as unknown as Prisma.InputJsonValue[],
        status: i % 10 === 9 ? "DRAFT" : "PUBLISHED",
        likes: 50 + ((i * 137) % 800),
        bookmarks: 20 + ((i * 61) % 300),
        sectionId,
        authorId,
        createdAt: createdDate,
        updatedAt: createdDate,
        topics: { connect: [{ id: TARGET_TOPIC_ID }] },
        tags: {
          connect: [
            { id: tagIds[i % tagIds.length] },
            { id: tagIds[(i + 3) % tagIds.length] },
          ],
        },
      },
      select: { id: true },
    });

    createdPostIds.push(post.id);

    if ((i + 1) % 20 === 0) {
      console.log(`[seed-topic] Created ${i + 1}/${postsToCreate} posts...`);
    }
  }

  console.log(`[seed-topic] Created ${createdPostIds.length} posts for topic ${topic.name}`);

  console.log("[seed-topic] Adding comments...");

  const guestNames = [
    "Bầu trời xanh", "Chiều thứ bảy", "Ngày tối giản", "Mưa tháng sáu",
    "Cà phê sữa đá", "Góc ban công", "Người qua đường", "Lá thu vàng",
  ];

  const commentPool = [
    "Bài viết rất hữu ích, cảm ơn tác giả nhiều nhé!",
    "Mình đã áp dụng thử và thấy hiệu quả thật sự!",
    "Đọc xong thấy nhẹ cả người, mong có thêm nhiều bài thế này.",
    "Đúng cái đang cần tìm, lưu lại để làm theo luôn.",
    "Chia sẻ chân thật quá, hóng phần tiếp theo nha.",
    "Kinh nghiệm thực tế thế này đáng giá hơn nghìn bài lý thuyết.",
    "Nhà mình cũng đang làm y hệt, đúng là hiệu quả mà.",
    "Hình ảnh minh họa đẹp nữa, tổng thể chỉ có đỉnh.",
    "Gửi ngay cho hội bạn thân cùng đọc nào!",
    "Đọc mà thấy muốn bắt tay vào làm ngay ngày mai.",
    "Cảm ơn vì những tips nhỏ nhưng cực kỳ áp dụng được.",
    "Phần cuối đọc xong thấy nhẹ nhàng lạ thường.",
    "Lâu lắm mới gặp bài viết khiến mình tắt điện thoại để đọc cho hết.",
    "Đồng ý với tác giả, quan trọng là đều đặn mỗi ngày.",
    "Sẽ thử trong tháng này rồi báo cáo kết quả sau ha!",
    "Bài viết có chiều sâu mà vẫn dễ đọc, 10 điểm!",
  ];

  const replyPool = [
    "Cảm ơn bạn đã ghé đọc, chúc bạn áp dụng thành công nha!",
    "Mình cũng đang làm theo, cùng cập nhật tiến độ nhé!",
    "Chuẩn luôn, thêm chút kiên nhẫn là ổn thoy.",
  ];

  let totalComments = 0;

  for (const [postIdx, postId] of createdPostIds.entries()) {
    const commentCount = 3 + (postIdx % 5);
    const parentRows = Array.from({ length: commentCount }, (_, i) => {
      const useGuest = i % 3 !== 0;
      const member = authors[i % authors.length];
      return {
        postId,
        ...(useGuest && member ? {} : { authorId: member?.id }),
        authorName: useGuest
          ? guestNames[i % guestNames.length]!
          : member?.name ?? "Ẩn danh",
        authorAvatar: useGuest
          ? `https://picsum.photos/seed/guest-${i % 8}/96/96`
          : member?.avatar ?? null,
        content: commentPool[i % commentPool.length]!,
        createdAt: new Date(Date.now() - ((postIdx * 7 + i * 3) % 180) * 24 * 3600 * 1000),
      };
    });

    const createdParents = await prisma.comment.createManyAndReturn({
      data: parentRows,
      select: { id: true },
    });

    const replyRows = Array.from({ length: 2 }, (_, i) => ({
      postId,
      parentId: createdParents[i % createdParents.length]!.id,
      authorName: guestNames[(i + 2) % guestNames.length]!,
      content: replyPool[i % replyPool.length]!,
      createdAt: new Date(Date.now() - ((i * 5) % 150) * 24 * 3600 * 1000),
    }));
    await prisma.comment.createMany({ data: replyRows });

    totalComments += commentCount + replyRows.length;

    if ((postIdx + 1) % 20 === 0) {
      console.log(`[seed-topic] Added comments to ${postIdx + 1}/${createdPostIds.length} posts...`);
    }
  }

  console.log(`[seed-topic] Total comments added: ${totalComments}`);

  const finalCount = await prisma.post.count({
    where: { topics: { some: { id: TARGET_TOPIC_ID } } },
  });

  console.log(`[seed-topic] Done! Topic "${topic.name}" now has ${finalCount} posts.`);
}

main()
  .catch((error) => {
    console.error("[seed-topic] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });