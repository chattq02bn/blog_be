import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Prisma } from "../src/generated/prisma/client.js";
import env from "../src/config/env.js";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) });

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

function richBlocks(index: number, intro: string): Block[] {
  const sections: string[] = [
    ["Chuẩn bị", "Thực hiện", "Lưu ý nhỏ"],
    ["Bối cảnh", "Điều bất ngờ", "Bài học rút ra"],
    ["Khởi đầu", "Trải nghiệm", "Kết quả"],
  ][index % 3] ?? ["Chuẩn bị", "Thực hiện", "Kết quả"];

  const [s1, s2, s3] = sections;

  return [
    paragraph(intro),
    heading(s1!),
    paragraph("Trước khi bắt đầu, hãy đảm bảo bạn đã chuẩn bị đủ những điều kiện cơ bản dưới đây:"),
    bullet("Dành ra 15–30 phút yên tĩnh mỗi ngày"),
    bullet("Ghi lại mục tiêu rõ ràng, đo lường được"),
    bullet("Chọn nhịp độ phù hợp với lịch riêng của bạn"),
    image(`rich-${index}-a`, "Hình minh họa cho phần chuẩn bị"),
    heading(s2!),
    numbered("Bắt đầu với bước nhỏ nhất có thể để tạo đà"),
    numbered("Duy trì đều đặn liên tục trong ít nhất một tuần"),
    numbered("Ghi nhận cảm nhận và điều chỉnh linh hoạt"),
    paragraph("Cách làm từng bước như trên không đòi hỏi kỹ năng đặc biệt — chỉ cần bạn kiên trì vài ngày đầu."),
    heading(s3!),
    quote("Điều quan trọng không phải làm hoàn hảo ngay từ đầu, mà là bắt đầu và giữ được nhịp."),
    paragraph("Sau một tuần áp dụng, bạn sẽ thấy khác biệt rõ rệt về cảm giác chủ động. Hãy thử và chia sẻ kết quả của bạn nhé!"),
    image(`rich-${index}-b`, "Kết quả sau một tuần duy trì"),
  ];
}

async function main() {
  console.log("[seed] Cleaning up old data...");

  const tables = [
    "comment_reactions",
    "post_likes",
    "comments",
    "posts",
    "sidebar_items",
    "topics",
    "tags",
    "visit_stats",
    "social_links",
    "site_configs",
    "users",
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("denied") || msg.includes("permission") || msg.includes("does not exist")) {
        console.log(`[seed] Skip ${table} (${msg.includes("does not exist") ? "table not found" : "no delete permission"})`);
      } else {
        throw e;
      }
    }
  }

  console.log("[seed] Creating users...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@note.com",
      name: "Người quản trị",
      role: "ADMIN",
      passwordHash,
      logoName: "note",
      description: "Quản trị viên của blog note — sáng tạo, kết nối, lan tỏa.",
      avatar: "https://picsum.photos/seed/admin-avatar/96/96",
    },
  });

  const authors = await Promise.all(
    [
      ["author@note.com", "Giọt sương sớm"],
      ["lan@note.com", "Viện cà phê nhà"],
      ["minh@note.com", "Gọn gàng xinh"],
      ["huong@note.com", "Bầu trời nhà tôi"],
      ["duc@note.com", "Người đi bộ"],
    ].map(([email, name]) =>
      prisma.user.create({
        data: {
          email: email!,
          name: name!,
          role: "USER",
          passwordHash,
          avatar: `https://picsum.photos/seed/${name}-avatar/96/96`,
        },
      })
    )
  );

  console.log("[seed] Creating topics & tags...");
  const topicNames = [
    ["Mẹo sống xanh", "Chia sẻ các mẹo bảo vệ môi trường, sống xanh mỗi ngày."],
    ["Cà phê nhà", "Phương pháp pha cà phê tại nhà ngon như quán."],
    ["Chuyện nhà tôi", "Những câu chuyện đời thường trong gia đình."],
    ["Công thức cuối tuần", "Công thức món ăn cho bữa cuối tuần."],
    ["Sống chậm", "Lối sống chậm rãi, tận hưởng từng khoảnh khắc."],
    ["Sống một mình", "Kinh nghiệm sống độc lập cho người trẻ."],
    ["Ăn vặt văn phòng", "Đồ ăn vặt phù hợp cho dân công sở."],
    ["Mẹo tiết kiệm", "Cách quản lý chi tiêu và tiết kiệm hiệu quả."],
    ["Du lịch bụi", "Trải nghiệm những chuyến đi tự túc, tiết kiệm."],
    ["Thời trang công sở", "Phối đồ thanh lịch cho ngày làm việc."],
    ["Nội thất căn hộ nhỏ", "Tối ưu không gian sống vài chục mét vuông."],
    ["Sức khỏe tinh thần", "Chăm sóc cảm xúc và cân bằng cuộc sống."],
    ["Ẩm thực đường phố", "Khám phá ẩm thực từ quán vỉa hè đến chợ đêm."],
    ["Làm vườn tại gia", "Trồng rau, chăm cây trên ban công nhà phố."],
    ["Công thức chay", "Món chay đơn giản mà đủ dinh dưỡng."],
    ["Fitness tại nhà", "Tập luyện đều đặn không cần phòng gym."],
    ["Thú cưng", "Chăm sóc chó mèo và các bạn nhỏ lông xù."],
    ["Đọc sách mỗi ngày", "Gợi ý sách hay và cách giữ thói quen đọc."],
    ["Viết lách sáng tạo", "Kỹ thuật kể chuyện cho người mới bắt đầu viết."],
    ["Quản lý thời gian", "Nhiều việc mà vẫn có giờ cho riêng mình."],
  ] as const;

  const topics: Record<string, string> = {};
  for (const [name, description] of topicNames) {
    const topic = await prisma.topic.create({ data: { name, description } });
    topics[name] = topic.id;
  }

  // Topic chính cho trang chủ
  const lifestyle = await prisma.topic.create({
    data: {
      name: "lifestyle",
      description: "Góc chia sẻ về nhà cửa, ẩm thực, du lịch, thời trang và sức khỏe.",
    },
  });

  const tagNames = [
    "tản văn", "cảm xúc", "mẹo hay", "công thức", "chia sẻ",
    "kỹ năng", "du lịch", "sức khỏe", "review", "đời sống",
    "buổi sáng", "nội thất", "thói quen", "tiết kiệm thời gian",
  ];
  const tags: Record<string, string> = {};
  for (const name of tagNames) {
    const tag = await prisma.tag.create({ data: { name } });
    tags[name]! = tag.id;
  }

  console.log("[seed] Creating sidebar items...");
  const topicIdList = Object.values(topics);
  const sidebarSeed: { name: string; slug: string; topicIds: string[]; children: { name: string; slug: string; topicIds: string[] }[] }[] = [
    { name: "Xu hướng", slug: "xu-huong", topicIds: [topics["Cà phê nhà"]!], children: [] },
    { name: "Tạp chí", slug: "tap-chi", topicIds: [topics["Chuyện nhà tôi"]!, topics["Công thức cuối tuần"]!], children: [] },
    {
      name: "Thử thách",
      slug: "thu-thach",
      topicIds: [topics["Sống một mình"]!],
      children: [
        { name: "Sống một mình", slug: "song-mot-minh", topicIds: [topics["Sống một mình"]!] },
        { name: "Cà phê tại nhà", slug: "ca-phe-tai-nha", topicIds: [topics["Cà phê nhà"]!] },
        { name: "Dậy sớm 5 giờ", slug: "day-som-5-gio", topicIds: [topics["Sống chậm"]!] },
      ],
    },
    {
      name: "Tài chính",
      slug: "tai-chinh",
      topicIds: [topics["Mẹo tiết kiệm"]!],
      children: [
        { name: "Việc làm thêm", slug: "viec-lam-them", topicIds: [topics["Mẹo tiết kiệm"]!] },
        { name: "Mẹo tiết kiệm", slug: "meo-tiet-kiem", topicIds: [topics["Mẹo tiết kiệm"]!] },
      ],
    },
    {
      name: "Du lịch",
      slug: "du-lich",
      topicIds: [topics["Du lịch bụi"]!],
      children: [
        { name: "Đà Lạt cuối tuần", slug: "da-lat-cuoi-tuan", topicIds: [topics["Du lịch bụi"]!] },
        { name: "Sapa tự túc", slug: "sapa-tu-tuc", topicIds: [topics["Du lịch bụi"]!] },
      ],
    },
    {
      name: "Công sở",
      slug: "cong-so",
      topicIds: [topics["Thời trang công sở"]!],
      children: [
        { name: "Phối đồ thứ Hai", slug: "phoi-do-thu-hai", topicIds: [topics["Thời trang công sở"]!] },
        { name: "Giày dép văn phòng", slug: "giay-dep-van-phong", topicIds: [topics["Thời trang công sở"]!] },
      ],
    },
    {
      name: "Nhà cửa",
      slug: "nha-cua",
      topicIds: [topics["Nội thất căn hộ nhỏ"]!],
      children: [
        { name: "Góc làm việc", slug: "goc-lam-viec", topicIds: [topics["Nội thất căn hộ nhỏ"]!] },
        { name: "Bếp nhỏ gọn gàng", slug: "bep-nho-gon-gang", topicIds: [topics["Chuyện nhà tôi"]!] },
      ],
    },
    {
      name: "Sức khỏe",
      slug: "suc-khoe",
      topicIds: [topics["Sức khỏe tinh thần"]!, topics["Fitness tại nhà"]!],
      children: [
        { name: "Thiền buổi sáng", slug: "thien-buoi-sang", topicIds: [topics["Sức khỏe tinh thần"]!] },
        { name: "Bài tập tại bàn", slug: "bai-tap-tai-ban", topicIds: [topics["Fitness tại nhà"]!] },
      ],
    },
    {
      name: "Ăn uống",
      slug: "an-uong",
      topicIds: [topics["Ẩm thực đường phố"]!, topics["Công thức chay"]!],
      children: [
        { name: "Chợ đêm cuối tuần", slug: "cho-dem-cuoi-tuan", topicIds: [topics["Ẩm thực đường phố"]!] },
        { name: "Món chay giả mặn", slug: "mon-chay-gia-man", topicIds: [topics["Công thức chay"]!] },
      ],
    },
    {
      name: "Sổ tay sống",
      slug: "so-tay-song",
      topicIds: [topics["Thú cưng"]!, topics["Đọc sách mỗi ngày"]!, topics["Viết lách sáng tạo"]!, topics["Quản lý thời gian"]!],
      children: [
        { name: "Nuôi mèo lần đầu", slug: "nuoi-meo-lan-dau", topicIds: [topics["Thú cưng"]!] },
        { name: "50 cuốn sách trong năm", slug: "50-cuon-sach-trong-nam", topicIds: [topics["Đọc sách mỗi ngày"]!] },
      ],
    },
  ];

  let parentIdx = 0;
  const createdParentRefs: { id: string; name: string }[] = [];
  for (const item of sidebarSeed) {
    const parent = await prisma.sidebarItem.create({
      data: {
        name: item.name,
        slug: item.slug,
        description: `Nhóm chủ đề "${item.name}".`,
        idx: parentIdx,
        ...(item.topicIds.length ? { topics: { connect: item.topicIds.map((id) => ({ id })) } } : {}),
      },
    });
    createdParentRefs.push({ id: parent.id, name: item.name });
    parentIdx += 1;

    let childIdx = 0;
    for (const child of item.children) {
      await prisma.sidebarItem.create({
        data: {
          name: child.name,
          slug: child.slug,
          description: `Chuyên mục nhỏ thuộc nhóm ${item.name}.`,
          idx: childIdx,
          parentId: parent.id,
          ...(child.topicIds.length ? { topics: { connect: child.topicIds.map((id) => ({ id })) } } : {}),
        },
      });
      childIdx += 1;
    }
  }

  console.log("[seed] Creating extra sidebar parents...");
  /* ~100 mục cha để test dữ liệu lớn: home + sidebar kéo vô hạn bằng useInView */
  const EXTRA_PARENTS = 90;
  const extraParentThemes = [
    "Khám phá", "Góc nhỏ", "Nhịp sống", "Hành trình", "Bản tin",
    "Chia sẻ", "Cảm hứng", "Khoảnh khắc", "Đam mê", "Hành trang",
  ];
  for (let i = 0; i < EXTRA_PARENTS; i += 1) {
    const order = i + 1;
    const theme = extraParentThemes[i % extraParentThemes.length]!;
    const name = `${theme} #${String(order).padStart(3, "0")}`;
    const parent = await prisma.sidebarItem.create({
      data: {
        name,
        slug: `nhom-chu-de-${order}`,
        description: `Nhóm chủ đề thử nghiệm số ${order} — dữ liệu lớn cho infinite scroll.`,
        idx: parentIdx,
        topics: { connect: [{ id: topicIdList[i % topicIdList.length]! }] },
      },
    });
    parentIdx += 1;
    createdParentRefs.push({ id: parent.id, name });
  }

  console.log("[seed] Creating bulk sidebar children...");
  /* ~100 mục con: rải đều lên các nhóm, 30 cái đầu dồn vào nhóm đầu
     để tạo nhóm có nhiều hơn 10 mục con test nút "xem thêm" */
  const BULK_CHILDREN_TOTAL = 100;
  const childSlugBase = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  const childCounter = new Map<string, number>();

  for (let i = 0; i < BULK_CHILDREN_TOTAL; i += 1) {
    /* 30 record đầu gắn vào nhóm đầu tiên để tạo nhóm có nhiều mục con */
    const parentRef =
      i < 30 ? createdParentRefs[0]! : createdParentRefs[i % createdParentRefs.length]!;
    const orderInParent = (childCounter.get(parentRef.id) ?? 0) + 1;
    childCounter.set(parentRef.id, orderInParent);

    await prisma.sidebarItem.create({
      data: {
        name: `${parentRef.name} • chuyên mục ${String(orderInParent).padStart(2, "0")}`,
        slug: `${childSlugBase(parentRef.name)}-${orderInParent}`,
        description: `Chuyên mục thử nghiệm số ${orderInParent} thuộc nhóm ${parentRef.name}.`,
        /* idx đặt sau các mục con thật để thứ tự hiển thị không bị xáo trộn */
        idx: 100 + orderInParent,
        parentId: parentRef.id,
        topics: { connect: [{ id: topicIdList[i % topicIdList.length]! }] },
      },
    });
  }
  console.log(`[seed] Created ${BULK_CHILDREN_TOTAL} bulk sidebar children`);

  console.log("[seed] Creating posts...");
  type PostDef = {
    title: string;
    excerpt: string;
    authorIdx: number;
    status: "published" | "draft";
    daysAgo: number;
    likes: number;
    bookmarks: number;
    topics: string[];
    tagList: string[];
    intro: string;
  };

  /* Sinh bài viết cho sidebar topics — trải đều theo vòng tròn */
  const generatedPostDefs: PostDef[] = [];
  let genIndex = 0;
  const topicEntries = Object.entries(topics);
  for (let i = 0; i < 60; i++) {
    const [, topicId] = topicEntries[i % topicEntries.length]!;
    const title = `Bài viết chủ đề ${i + 1}: Mẹo sống xanh mỗi ngày`;
    generatedPostDefs.push({
      title,
      excerpt: `${title} — góc chia sẻ từ cộng đồng note.`,
      authorIdx: (genIndex + 1) % authors.length,
      status: genIndex % 9 === 8 ? "draft" : "published",
      daysAgo: 11 + ((genIndex * 3) % 45),
      likes: 120 + ((genIndex * 137) % 900),
      bookmarks: 40 + ((genIndex * 61) % 300),
      topics: [lifestyle.id, topicId],
      tagList: [
        tagNames[genIndex % tagNames.length]!,
        tagNames[(genIndex + 3) % tagNames.length]!,
      ],
      intro: `Chuyên mục nhỏ trong chủ đề này. ${title}.`,
    });
    genIndex += 1;
  }

  /* Sinh hàng loạt bài viết cho toàn bộ topic — dữ liệu lớn để test infinite scroll */
  const BULK_COUNT = 300;
  const bulkSubjects = [
    "Du lịch Đà Lạt", "Phòng trọ gọn gàng", "Cây cảnh ban công", "Bữa sáng lành mạnh",
    "Sổ tay chi tiêu", "Góc làm việc tại nhà", "Thực đơn tuần", "Chăm sóc da mùa hanh",
    "Đi bộ mỗi chiều", "Hộp cơm văn phòng", "Tủ đồ tối giản", "Cà phê muối",
    "Sách nên đọc", "Lập kế hoạch tuần", "Dọn nhà cuối năm", "Rau mầm tự trồng",
    "Yoga buổi sáng", "Chó con tháng đầu", "Nhật ký viết lách", "Tiết kiệm điện",
    "Balo du lịch bụi", "Kệ sách mini", "Trà hoa củ", "Giày đi bộ",
    "Món chay ngày rằm", "Plank mỗi ngày", "Vườn thẳng đứng", "Ảnh film",
    "Bullet journal", "Đồ cũ tách chế", "Nước ép detox", "Ngủ đúng giờ",
    "Hồ cá mini", "Ghim trang trí tường", "Bánh mì nguội", "Tập tạ tay không",
    "Mèo tam thể", "Podcast hữu ích", "Viết nhật ký", "Lịch làm việc linh hoạt",
  ];
  const bulkAngles = [
    "Kinh nghiệm thật sau 30 ngày áp dụng",
    "Checklist bắt đầu cho người mới hoàn toàn",
    "5 sai lầm hay gặp và cách khắc phục",
    "Chi phí thực tế từng khoản mục",
    "Những điều tôi ước biết sớm hơn",
    "Hướng dẫn từng bước cực dễ làm theo",
    "So sánh các cách làm phổ biến hiện nay",
    "Câu chuyện lần đầu thử nghiệm thất bại",
    "Mẹo nhỏ giúp duy trì lâu dài",
    "Tổng kết sau một mùa thử nghiệm",
  ];
  const bulkPostDefs: PostDef[] = [];
  for (let i = 0; i < BULK_COUNT; i += 1) {
    const subject = bulkSubjects[i % bulkSubjects.length]!;
    const angle = bulkAngles[(i * 3 + Math.floor(i / bulkSubjects.length)) % bulkAngles.length]!;
    const title = `${subject} — ${angle}`;
    const topicA = topicNames[i % topicNames.length]![0];
    const topicB = topicNames[(i * 7 + 5) % topicNames.length]![0];
    bulkPostDefs.push({
      title,
      excerpt: `${title}. Bài viết nằm trong chuỗi nội dung thường tuần của cộng đồng note.`,
      authorIdx: (i + 2) % authors.length,
      status: i % 11 === 10 ? "draft" : "published",
      daysAgo: 12 + ((i * 7) % 110),
      likes: 80 + ((i * 211) % 1400),
      bookmarks: 30 + ((i * 97) % 520),
      topics: [
        lifestyle.id,
        ...new Set(
          [
            ...(topics[topicA] ? [topics[topicA]!] : []),
            ...(topics[topicB] ? [topics[topicB]!] : []),
          ]
        ),
      ],
      tagList: [
        tagNames[i % tagNames.length]!,
        tagNames[(i * 5 + 2) % tagNames.length]!,
      ],
      intro: `Nội dung mẫu thuộc chuyên đề ${subject.toLowerCase()}. ${angle}.`,
    });
  }

  const handwrittenPostDefs: PostDef[] = [
    {
      title: "Thói quen 10 phút buổi sáng giúp ngày sống ngăn nắp hơn",
      excerpt: "Chỉ dành 10 phút buổi sáng cho riêng mình, chất lượng cả một ngày đã đổi khác.",
      authorIdx: 0,
      status: "published",
      daysAgo: 2,
      likes: 892,
      bookmarks: 372,
      topics: [lifestyle.id],
      tagList: ["đời sống", "buổi sáng", "thói quen"],
      intro: "Việc tôi làm rất đơn giản: mở cửa sổ cho căn phòng thở, pha một tách cà phê và ghi ra 3 việc cần làm trong ngày.",
    },
    {
      title: "Biến phòng khách thành nơi ai cũng muốn ngồi nhâm nhi cà phê",
      excerpt: "Chìa khóa nằm ở 3 điều: đèn ánh sáng gián tiếp, sách báo trong tầm tay và sofa quay hướng nắng.",
      authorIdx: 1,
      status: "published",
      daysAgo: 4,
      likes: 1240,
      bookmarks: 654,
      topics: [lifestyle.id, topics["Cà phê nhà"]!],
      tagList: ["nội thất", "đời sống"],
      intro: "Nhân dịp chuyển nhà, tôi quyết định biến phòng khách thành góc cà phê yêu thích nhất căn nhà.",
    },
    {
      title: "Quy tắc \"chỉ 5 phút\" giúp việc nhà không còn là gánh nặng",
      excerpt: "Đặt mục tiêu dọn sạch hoàn hảo là chưa bao giờ bắt đầu được. Tôi chọn quy tắc chỉ 5 phút.",
      authorIdx: 2,
      status: "published",
      daysAgo: 6,
      likes: 2031,
      bookmarks: 1102,
      topics: [lifestyle.id],
      tagList: ["thói quen", "tiết kiệm thời gian"],
      intro: "Bật đồng hồ hẹn giờ và dọn trong phạm vi có thể. 5 phút là đủ, thậm chí như vậy đã là thành công.",
    },
    {
      title: "3 nguyên tắc vàng giúp khu vực cửa ra vào không bao giờ bừa bộn",
      excerpt: "Nguyên nhân chỉ đơn giản là \"không có chỗ để đồ\". Ba nguyên tắc sau sẽ giải quyết tận gốc.",
      authorIdx: 3,
      status: "published",
      daysAgo: 8,
      likes: 1567,
      bookmarks: 880,
      topics: [lifestyle.id],
      tagList: ["đời sống", "mẹo hay"],
      intro: "Giày dép chỉ giữ đủ, tạo vị trí cố định cho túi khóa, ô dù gom về một giá — đơn giản vậy thôi.",
    },
    {
      title: "Cách pha latte nghệ thuật tại nhà không cần máy móc đắt tiền",
      excerpt: "Chỉ với một cái nồi nhỏ và chút kiên nhẫn, ly latte nhà làm vẫn ngon không kém quán.",
      authorIdx: 1,
      status: "published",
      daysAgo: 3,
      likes: 987,
      bookmarks: 456,
      topics: [lifestyle.id, topics["Cà phê nhà"]!, topics["Công thức cuối tuần"]!],
      tagList: ["công thức", "đời sống"],
      intro: "Sữa hạt đã trở thành lựa chọn phổ biến, nhưng sữa tươi nguyên chất vẫn là vua của ly latte.",
    },
    {
      title: "Đi bộ 30 phút mỗi chiều — thói quen rẻ nhất cho sức khỏe",
      excerpt: "Không cần thẻ gym, không cần dụng cụ, chỉ cần một đôi giày thoải mái và sự đều đặn.",
      authorIdx: 4,
      status: "published",
      daysAgo: 5,
      likes: 743,
      bookmarks: 321,
      topics: [lifestyle.id, topics["Sống chậm"]!],
      tagList: ["sức khỏe", "thói quen"],
      intro: "Sau hai tuần duy trì, tôi ngủ sâu hơn và tinh thần buổi sáng tốt hẳn lên.",
    },
    {
      title: "Mẹo tiết kiệm điện mùa nóng mà vẫn mát rượi",
      excerpt: "Một vài chỉnh sửa nhỏ trong thói quen dùng điện có thể cắt giảm đáng kể hóa đơn tháng.",
      authorIdx: 0,
      status: "published",
      daysAgo: 9,
      likes: 654,
      bookmarks: 512,
      topics: [lifestyle.id, topics["Mẹo tiết kiệm"]!, topics["Mẹo sống xanh"]!],
      tagList: ["mẹo hay", "tiết kiệm thời gian"],
      intro: "Quạt kết hợp chế độ hẹn giờ của điều hòa là tổ hợp tiết kiệm nhất mà tôi từng thử.",
    },
    {
      title: "Cuối tuần dọn nhà cùng con — vừa vui vừa gọn",
      excerpt: "Biến việc nhà thành trò chơi, các con hào hứng còn mẹ bớt mỏi lưng.",
      authorIdx: 3,
      status: "published",
      daysAgo: 7,
      likes: 432,
      bookmarks: 187,
      topics: [lifestyle.id, topics["Chuyện nhà tôi"]!],
      tagList: ["chia sẻ", "đời sống"],
      intro: "Chúng tôi chia khu nhà thành ba \"hòn đảo\" và mỗi người phụ trách một đảo mỗi tuần.",
    },
    {
      title: "\"Viết\" là cách tôi lớn lên từ từ",
      excerpt: "Mỗi ngày 300 chữ, chẳng để ai đọc — chỉ để hiểu mình hơn qua từng trang.",
      authorIdx: 0,
      status: "published",
      daysAgo: 10,
      likes: 1102,
      bookmarks: 733,
      topics: [lifestyle.id, topics["Sống chậm"]!],
      tagList: ["tản văn", "cảm xúc"],
      intro: "Tôi bắt đầu viết nhật ký từ năm thứ nhất đại học, và chưa bao giờ dừng lại kể từ đó.",
    },
    {
      title: "Ăn vặt văn phòng không tăng cân — 5 gợi ý thực tế",
      excerpt: "Chọn đúng loại snack và thời điểm ăn, bạn vẫn giữ được vóc dáng mà chẳng bỏ lỡ niềm vui.",
      authorIdx: 2,
      status: "draft",
      daysAgo: 1,
      likes: 12,
      bookmarks: 8,
      topics: [lifestyle.id, topics["Ăn vặt văn phòng"]!],
      tagList: ["mẹo hay", "sức khỏe"],
      intro: "Hạt óc chó và trái cây sấy không đường là bộ đôi luôn có mặt trong ngăn kéo của tôi.",
    },
    {
      title: "Sống một mình: 10 món đồ nên mua ngay từ đầu",
      excerpt: "Danh sách đúc kết từ ba năm tự lập — những món nhỏ nhưng cứu cả tuần của bạn.",
      authorIdx: 4,
      status: "draft",
      daysAgo: 2,
      likes: 31,
      bookmarks: 22,
      topics: [lifestyle.id, topics["Sống một mình"]!],
      tagList: ["chia sẻ", "kỹ năng"],
      intro: "Bộ đồ vá áo, nồi chiên không dầu và một chiếc đèn học tốt là ba món đáng tiền nhất.",
    },
    {
      title: "Tái chế đồ cũ trong nhà: bắt đầu từ hũ thủy tinh",
      excerpt: "Đừng vội vứt hũ thuỷ tinh — chúng là đạo cụ trang trí và lưu trữ tuyệt vời.",
      authorIdx: 1,
      status: "draft",
      daysAgo: 1,
      likes: 18,
      bookmarks: 11,
      topics: [lifestyle.id, topics["Mẹo sống xanh"]!],
      tagList: ["mẹo hay", "đời sống"],
      intro: "Chỉ cần nước ấm và chút baking soda, phần keo dính trên hũ sẽ bong sạch trong vài phút.",
    },
  ];

  const postDefs: PostDef[] = [
    ...handwrittenPostDefs,
    ...generatedPostDefs,
    ...bulkPostDefs,
  ];

  /* ====== BATCH POST CREATION ====== */
  const BATCH = 100;
  const createdPosts: { id: string; slug: string }[] = [];

  for (let batchStart = 0; batchStart < postDefs.length; batchStart += BATCH) {
    const batch = postDefs.slice(batchStart, batchStart + BATCH);
    const postData = batch.map((def, j) => {
      const i = batchStart + j;
      const createdDate = new Date(Date.now() - def.daysAgo * 24 * 3600 * 1000);
      const slugBase = def.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      return {
        title: def.title,
        slug: `${slugBase}-${(i + 1).toString(36)}`,
        excerpt: def.excerpt,
        cover: `https://picsum.photos/seed/post-${i + 1}/1280/670`,
        bodyBlocks: richBlocks(i, def.intro) as unknown as Prisma.InputJsonValue[],
        status: (def.status === "published" ? "PUBLISHED" : "DRAFT") as "PUBLISHED" | "DRAFT",
        likes: def.likes,
        bookmarks: def.bookmarks,
        authorId: authors[def.authorIdx]!.id,
        createdAt: createdDate,
        updatedAt: createdDate,
      };
    });

    const inserted = await prisma.post.createMany({ data: postData });
    console.log(`[seed]   Created posts batch ${batchStart}-${batchStart + inserted.count} (${inserted.count})`);

    /* Query back to get ids + slugs */
    const startIdx = batchStart;
    const endIdx = batchStart + batch.length;
    const slugs = batch.map((_, j) => `${postDefs[startIdx + j].title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${(startIdx + j + 1).toString(36)}`);
    const rows = await prisma.$queryRawUnsafe<{ id: string; slug: string }[]>(
      `SELECT id, slug FROM posts WHERE slug = ANY($1)`,
      slugs
    );
    const bySlug = new Map(rows.map((r) => [r.slug, r.id]));
    for (const slug of slugs) {
      const id = bySlug.get(slug);
      if (id) createdPosts.push({ id, slug });
    }

    /* Connect topics via junction table */
    const topicRows: { postId: string; topicId: string }[] = [];
    for (let j = 0; j < batch.length; j++) {
      const def = batch[j]!;
      const pid = bySlug.get(slugs[j]!)!;
      for (const tid of def.topics) {
        topicRows.push({ postId: pid, topicId: tid });
      }
    }
    if (topicRows.length > 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_PostToTopic" ("A", "B") SELECT "postId", "topicId" FROM unnest($1::text[], $2::text[]) AS t("postId", "topicId") ON CONFLICT DO NOTHING`,
        topicRows.map((r) => r.postId),
        topicRows.map((r) => r.topicId)
      );
    }

    /* Connect tags via junction table */
    const tagRows: { postId: string; tagId: string }[] = [];
    for (let j = 0; j < batch.length; j++) {
      const def = batch[j]!;
      const pid = bySlug.get(slugs[j]!)!;
      for (const name of def.tagList) {
        const tid = tags[name];
        if (tid) tagRows.push({ postId: pid, tagId: tid });
      }
    }
    if (tagRows.length > 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "_PostToTag" ("A", "B") SELECT "postId", "tagId" FROM unnest($1::text[], $2::text[]) AS t("postId", "tagId") ON CONFLICT DO NOTHING`,
        tagRows.map((r) => r.postId),
        tagRows.map((r) => r.tagId)
      );
    }
  }

  console.log(`[seed] Total ${createdPosts.length} posts created`);

  /* ====== BATCH COMMENT CREATION ====== */
  console.log("[seed] Creating comments...");
  const guestNames = [
    "Bầu trời xanh",
    "Chiều thứ bảy",
    "Ngày tối giản",
    "Mưa tháng sáu",
    "Cà phê sữa đá",
    "Góc ban công",
    "Người qua đường",
    "Lá thu vàng",
  ];

  const commenters = await Promise.all(
    guestNames.map((nickname) =>
      prisma.commenter.upsert({
        where: { id: guestNames.indexOf(nickname) + 1 },
        update: {},
        create: { id: guestNames.indexOf(nickname) + 1, nickname, tokenHash: `seed-${nickname.toLowerCase().replace(/\s+/g, '-')}` },
      })
    )
  );

  const commentPool = [
    "Bài viết rất hữu ích, cảm ơn tác giả nhiều nhé!",
    "Mình đã áp dụng thử một tuần và thấy hiệu quả thật sự!",
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

  const COMMENTS_PER_POST = 15;
  const REPLIES_PER_POST = 10;
  const COMMENT_BATCH = 500;

  /* Build all parent comment rows at once */
  const allParentRows: { postId: string; commenterId: number; content: string; createdAt: Date }[] = [];
  for (const [postIdx, post] of createdPosts.entries()) {
    for (let i = 0; i < COMMENTS_PER_POST; i++) {
      const commenter = commenters[i % commenters.length]!;
      allParentRows.push({
        postId: post.id,
        commenterId: commenter.id,
        content: commentPool[i % commentPool.length]!,
        createdAt: new Date(Date.now() - ((postIdx * COMMENTS_PER_POST + i * 7) % 180) * 24 * 3600 * 1000),
      });
    }
  }

  /* Insert parents in batches and collect their IDs for replies */
  const allParentIds: { postId: string; id: string }[] = [];
  for (let i = 0; i < allParentRows.length; i += COMMENT_BATCH) {
    const batch = allParentRows.slice(i, i + COMMENT_BATCH);
    const returned = await prisma.comment.createManyAndReturn({
      data: batch,
      select: { id: true, postId: true },
    });
    allParentIds.push(...returned);
    console.log(`[seed]   Created parent comments batch ${i}-${i + returned.length}`);
  }

  /* Build all reply rows */
  const allReplyRows: { postId: string; parentId: string; commenterId: number; content: string; createdAt: Date }[] = [];
  for (const [postIdx, post] of createdPosts.entries()) {
    const postParents = allParentIds.filter((p) => p.postId === post.id);
    for (let i = 0; i < REPLIES_PER_POST; i++) {
      allReplyRows.push({
        postId: post.id,
        parentId: postParents[i % postParents.length]!.id,
        commenterId: commenters[(i + 2) % commenters.length]!.id,
        content: replyPool[i % replyPool.length]!,
        createdAt: new Date(Date.now() - ((i * 5) % 150) * 24 * 3600 * 1000),
      });
    }
  }

  /* Insert replies in batches */
  for (let i = 0; i < allReplyRows.length; i += COMMENT_BATCH) {
    const batch = allReplyRows.slice(i, i + COMMENT_BATCH);
    await prisma.comment.createMany({ data: batch });
    console.log(`[seed]   Created reply batch ${i}-${i + batch.length}`);
  }

  /* Reactions for first post */
  const firstPostParents = allParentIds.filter((p) => p.postId === createdPosts[0]?.id).slice(0, 10);
  if (firstPostParents.length > 0) {
    await prisma.commentReaction.createMany({
      data: firstPostParents.map((c, i) => ({
        commentId: c.id,
        userId: admin.id,
        emoji: i % 2 ? "❤️" : "👍",
      })),
    });
  }

  console.log(
    `[seed] Created ${allParentRows.length + allReplyRows.length} comments`
  );

  console.log("[seed] Creating visit stats for 2026...");
  function pseudo(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const visitRows: { month: string; day: number; visits: number }[] = [];

  for (let monthIdx = 0; monthIdx < 12; monthIdx += 1) {
    const month = `2026-${String(monthIdx + 1).padStart(2, "0")}`;
    const base = 800 + monthIdx * 60;

    for (let day = 1; day <= DAYS_IN_MONTH[monthIdx]!; day += 1) {
      const weekday = (day + monthIdx * 2) % 7;
      const noise = pseudo(monthIdx * 100 + day);
      const visits = Math.round(
        base * (weekday === 5 || weekday === 6 ? 1.25 : 1) + noise * 400
      );
      visitRows.push({ month, day, visits });
    }
  }

  await prisma.visitStat.createMany({ data: visitRows });

  console.log(`[seed] Admin: admin@note.com / Password123!`);
  console.log(`[seed] Authors: ${authors.map((a) => a.email).join(", ")} / Password123!`);
  console.log(`[seed] Created ${createdPosts.length} posts, ${visitRows.length} visit rows`);
}

main()
  .catch((error) => {
    console.error("[seed] Failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
