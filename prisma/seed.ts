import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client/edge.js";
import type { Prisma } from "@prisma/client/edge.js";
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
  await prisma.commentReaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.section.deleteMany();
  await prisma.sidebarItem.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.visitStat.deleteMany();
  await prisma.user.deleteMany();

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

  console.log("[seed] Creating sections...");
  const sectionDefs = [
    { slug: "y-tuong-song", title: "Ý tưởng sống", description: "Nhà cửa, nội thất và việc nhà. Những cách vun vén một ngày sống thoải mái hơn." },
    { slug: "meo-nho", title: "Mẹo nhỏ mỗi ngày", description: "Những thủ thuật nhỏ giúp cuộc sống gọn gàng và dễ chịu hơn." },
    { slug: "cau-chuyen", title: "Câu chuyện thường ngày", description: "Tản mạn, cảm xúc và những câu chuyện rất đời." },
  ];

  const sections: Record<string, string> = {};
  for (const [i, def] of sectionDefs.entries()) {
    const section = await prisma.section.create({
      data: { ...def, topicSlug: "lifestyle", idx: i },
    });
    sections[def.slug] = section.id;
  }

  console.log("[seed] Creating sections for sidebar topics...");
  /* Mỗi mục trong sidebar (cha hoặc con) có nhóm section riêng — trang chủ đề sẽ dùng */
  const extraGroups: {
    topicSlug: string;
    topicName?: string;
    topicNames?: string[];
    sections: { slug: string; title: string; description: string; topicSlug?: string }[];
    ideas: string[];
  }[] = [
    {
      topicSlug: "xu-huong",
      topicName: "Cà phê nhà",
      sections: [
        { slug: "xu-huong-noi-bat", title: "Đang được yêu thích", description: "Những chủ đề cộng đồng note đang bàn tán nhiều nhất tuần qua." },
      ],
      ideas: [
        "Xu hướng cà phê sạch đang thay đổi thói quen người trẻ",
        "Cold brew tại nhà: công thức chuẩn quán cho ngày nóng",
        "Vì sao cà phê rang mộc đang trở lại?",
        "5 góc làm việc đáng ghé nếu bạn thích nhâm nhi cà phê",
      ],
    },
    {
      topicSlug: "tap-chi",
      topicName: "Chuyện nhà tôi",
      sections: [
        { slug: "tap-chi-dac-biet", title: "Số đặc biệt", description: "Tuyển chọn những câu chuyện dài kỳ được đọc nhiều nhất tháng." },
        { slug: "tap-chi-thuong-nhat", title: "Nhịp sống thường nhật", description: "Góc nhìn nhẹ nhàng về việc nhà, bữa cơm và những buổi chiều." },
      ],
      ideas: [
        "Một tháng gọn lỏi đồ đạc: hành trình của gia đình nhỏ",
        "Bữa cơm chiều và bí quyết giữ lửa căn bếp",
        "Nhật ký sửa nhà 30 ngày không tranh cãi",
        "Kể lại chuyến đi đầu tiên cùng con",
        "Những món đồ cũ mang cả ký ức",
        "Cuối tuần ở nhà vẫn vui như đi chơi",
      ],
    },
    {
      topicSlug: "song-mot-minh",
      topicName: "Sống một mình",
      sections: [
        { slug: "song-mot-minh-kinh-nghiem", title: "Kinh nghiệm tự lập", description: "Bài học thực tế được đúc kết từ đời sống một mình." },
        { slug: "song-mot-minh-goc-nho", title: "Góc nhỏ của tôi", description: "Dọn gọn, nấu nướng và tự thưởng cho bản thân." },
      ],
      ideas: [
        "Thuê nhà lần đầu: 8 điều ai cũng nên biết",
        "Nấu ăn cho một người không hề buồn",
        "Hộp thuốc thông minh cho người sống một mình",
        "Chi phí sinh hoạt tháng đầu tự lập: sổ tay chi tiết",
        "An toàn khi ở một mình: thói quen nhỏ cứu nguy lớn",
        "Tự sửa vòi nước lần đầu và cái kết bất ngờ",
        "Một mình ăn Tết: menu gợi ý đủ đầy cho đêm trừ",
      ],
    },
    {
      topicSlug: "ca-phe-tai-nha",
      topicName: "Cà phê nhà",
      sections: [
        { slug: "ca-phe-tai-nha-cong-thuc", title: "Công thức pha chế", description: "Từ phin truyền thống đến latte nhà làm không cần máy móc." },
        { slug: "ca-phe-tai-nha-dung-cu", title: "Dụng cụ tối giản", description: "Chỉ vài món cơ bản là đủ một góc cà phê trong nhà." },
      ],
      ideas: [
        "Pha phin ngon: tỉ lệ vàng 1:8 đơn giản nhất",
        "Tự làm sữa hạt cho latte không bị vón",
        "Bảo quản cà phê nguyên chất đúng cách",
        "Bạc xỉu tại nhà ngọt nhạt vừa vặn miệng",
        "Chọn mua máy xay đầu tiên cho người mới bắt đầu",
        "Trà chanh muối kiểu quán làm trong 10 phút",
      ],
    },
    {
      topicSlug: "day-som-5-gio",
      topicName: "Sống chậm",
      sections: [
        { slug: "day-som-thu-quen", title: "Thử thách 21 ngày", description: "Nhật ký tập dậy sớm của những người rất bình thường." },
        { slug: "day-som-buoi-sang", title: "Buổi sáng riêng tư", description: "Routine buổi sáng giúp cả ngày nhẹ nhàng hơn." },
      ],
      ideas: [
        "Ngày đầu dậy 5 giờ: cái kết không như mong đợi",
        "Routine buổi tối giúp sáng mai dễ dàng hơn",
        "Tôi làm gì trong 2 tiếng im lặng mỗi sáng",
        "Dậy sớm mà không mệt: 5 nguyên tắc giấc ngủ",
        "Tuần thứ ba của thử thách dậy sớm: gần bỏ cuộc rồi",
        "Bữa sáng nhanh gọn cho ngày bắt đầu lúc 5 giờ",
      ],
    },
    {
      topicSlug: "viec-lam-them",
      topicName: "Mẹo tiết kiệm",
      sections: [
        { slug: "viec-lam-them-kinh-nghiem", title: "Trải nghiệm thật", description: "Những công việc làm thêm và bài học từ thu nhập đầu tiên." },
      ],
      ideas: [
        "Làm thêm cuối tuần: nên bắt đầu từ đâu?",
        "Bán đồ handmade online: tháng đầu ra là thế?",
        "Việc part-time cho sinh viên: chọn thế nào cho khôn",
        "Thu nhập phụ đầu tiên và cách tôi chi tiêu nó",
      ],
    },
    {
      topicSlug: "meo-tiet-kiem",
      topicName: "Mẹo tiết kiệm",
      sections: [
        { slug: "meo-tiet-kiem-chi-tieu", title: "Quản lý chi tiêu", description: "Sổ tay chi tiêu và những con số biết nói." },
        { slug: "meo-tiet-kiem-sanh-de", title: "Tiết kiệm không khó", description: "Mẹo nhỏ áp dụng ngay hôm nay cho ví tiền nhẹ nhõm." },
      ],
      ideas: [
        "Quy tắc 50/30/20 áp dụng thực tế tháng đầu",
        "Siêu thị cuối tuần: danh sách giúp đỡ tiêu hao tiền",
        "Hóa đơn điện giảm 20% nhờ 6 thói quen nhỏ",
        "Mục tiêu tiết kiệm 10 triệu: lộ trình 100 ngày",
        "Mua sắm online thông minh tránh bẫy giảm giá",
        "Nấu ăn tại nhà tiết kiệm bao nhiêu? Con số thật",
        "Kỹ năng thương lượng giá khi thuê nhà",
      ],
    },
    {
      topicSlug: "du-lich",
      topicNames: ["Du lịch bụi"],
      sections: [
        { slug: "da-lat-2-ngay", title: "Lịch trình Đà Lạt 2 ngày", description: "Tối giản thời gian mà vẫn trọn vị Đà Lạt.", topicSlug: "da-lat-cuoi-tuan" },
        { slug: "sapa-vi-mong", title: "Sapa cho ví mỏng", description: "Chi phí thực tế từng khoản khi đi Sapa tự túc.", topicSlug: "sapa-tu-tuc" },
      ],
      ideas: [
        "Lịch trình Đà Lạt tự túc 2 ngày 1 đêm cho nhóm bạn",
        "Sapa mùa lúa chín: đi đâu, ăn gì, chi phí bao nhiêu?",
        "Mẹo săn vé xe giá rẻ dịp cuối tuần",
        "Những quán cà phê view săn mây đáng ghé",
      ],
    },
    {
      topicSlug: "cong-so",
      topicNames: ["Thời trang công sở"],
      sections: [
        { slug: "phoi-do-tuan-le", title: "Phối đồ cả tuần", description: "Lịch phối đồ từ thứ Hai đến thứ Sáu.", topicSlug: "phoi-do-thu-hai" },
        { slug: "chon-giay-di-lam", title: "Chọn giày đi làm", description: "Đẹp, bền và không đau chân sau 8 tiếng.", topicSlug: "giay-dep-van-phong" },
      ],
      ideas: [
        "Bảng màu an toàn cho tủ đồ công sở",
        "Cách phối blazer không bị già trước tuổi",
        "Giày da mới mua nên xử lý gì trước khi đi làm",
        "Chiếc túi vừa đẹp vừa đủ đựng laptop",
      ],
    },
    {
      topicSlug: "nha-cua",
      topicNames: ["Nội thất căn hộ nhỏ"],
      sections: [
        { slug: "dung-goc-lam-viec", title: "Dựng góc làm việc", description: "2m² đủ xanh, đủ sáng, đủ tập trung.", topicSlug: "goc-lam-viec" },
        { slug: "sap-xep-bep-nho", title: "Sắp xếp bếp nhỏ", description: "Nguyên tắc tam giác vàng cho bếp chật.", topicSlug: "bep-nho-gon-gang" },
      ],
      ideas: [
        "Dựng góc làm việc 2m vuông dưới tay em",
        "Bàn kéo thông minh cho căn hộ studio",
        "Sắp xếp tủ bếp theo nguyên tắc tam giác vàng",
        "5 phụ kiện giúp bếp nhỏ sạch lâu bẩn",
      ],
    },
    {
      topicSlug: "suc-khoe",
      topicNames: ["Sức khỏe tinh thần", "Fitness tại nhà"],
      sections: [
        { slug: "thien-10-phut", title: "Thiền 10 phút", description: "Khởi đầu nhẹ nhàng cho người bận rộn.", topicSlug: "thien-buoi-sang" },
        { slug: "bai-tap-tai-ban", title: "Vận động tại bàn", description: "Đau cổ vai gáy thì làm ngay những này.", topicSlug: "bai-tap-tai-ban" },
      ],
      ideas: [
        "Thiền 10 phút mỗi sáng đổi thay gì sau một tháng?",
        "Hít thở 4-7-8 chữa mất ngủ có thật sự hiệu quả?",
        "Đau cổ vai gáy vì ngồi máy tính: bài tập tại bàn",
        "Squat tại nhà 30 ngày, kết quả bất ngờ",
      ],
    },
    {
      topicSlug: "an-uong",
      topicNames: ["Ẩm thực đường phố", "Công thức chay"],
      sections: [
        { slug: "cho-dem-an-gi", title: "Chợ đêm ăn gì", description: "Không bỏ lỡ món nào trong một buổi dạo.", topicSlug: "cho-dem-cuoi-tuan" },
        { slug: "mon-chay-don-gian", title: "Món chay đơn giản", description: "Đủ dinh dưỡng, dễ nấu, dễ ghiền.", topicSlug: "mon-chay-gia-man" },
      ],
      ideas: [
        "Chợ đêm cuối tuần nên ăn gì để không lỡ món nào?",
        "Bánh tráng nướng kiểu Đà Lạt làm tại nhà",
        "Món chay giả mặn cho bữa cơm ngày rằm",
        "Ốc luộc sốt ớt cay xé lưỡi mà lại ghiền",
      ],
    },
    {
      topicSlug: "so-tay-song",
      topicNames: ["Thú cưng", "Đọc sách mỗi ngày"],
      sections: [
        { slug: "lan-dau-nuoi-meo", title: "Lần đầu nuôi mèo", description: "Chuẩn bị từ A đến Z cho mèo con về nhà.", topicSlug: "nuoi-meo-lan-dau" },
        { slug: "doc-sach-nam-nay", title: "Đọc sách năm nay", description: "Lộ trình 50 cuốn và cách chọn sách đáng đọc.", topicSlug: "50-cuon-sach-trong-nam" },
      ],
      ideas: [
        "Nuôi mèo lần đầu: những thứ phải chuẩn bị trước khi đưa bé về",
        "Tiêm phòng & tẩy giun cho mèo con: lịch cụ thể",
        "50 cuốn sách đáng đọc trong năm, chọn từ 500 cuốn",
        "Phương pháp đọc nhanh mà vẫn nhớ lâu",
      ],
    },
  ];

  for (const group of extraGroups) {
    for (const [i, def] of group.sections.entries()) {
      const section = await prisma.section.create({
        data: {
          slug: def.slug,
          title: def.title,
          description: def.description,
          topicSlug: def.topicSlug ?? group.topicSlug,
          idx: i,
        },
      });
      sections[def.slug] = section.id;
    }
  }

  console.log("[seed] Creating posts...");
  type PostDef = {
    title: string;
    excerpt: string;
    section: string;
    authorIdx: number;
    status: "published" | "draft";
    daysAgo: number;
    likes: number;
    bookmarks: number;
    topics: string[];
    tagList: string[];
    intro: string;
  };

  /* Sinh bài viết cho các section của sidebar topic — trải đều theo vòng tròn */
  const generatedPostDefs: PostDef[] = [];
  let genIndex = 0;
  for (const group of extraGroups) {
    const sectionKeys = group.sections.map((section) => section.slug);
    const connectNames = [
      ...(group.topicName ? [group.topicName] : []),
      ...(group.topicNames ?? []),
    ];
    group.ideas.forEach((title, j) => {
      generatedPostDefs.push({
        title,
        excerpt: `${title} — góc chia sẻ từ cộng đồng note.`,
        section: sectionKeys[j % sectionKeys.length]!,
        authorIdx: (genIndex + 1) % authors.length,
        status: genIndex % 9 === 8 ? "draft" : "published",
        daysAgo: 11 + ((genIndex * 3) % 45),
        likes: 120 + ((genIndex * 137) % 900),
        bookmarks: 40 + ((genIndex * 61) % 300),
        topics: [
          lifestyle.id,
          ...connectNames.map((name) => topics[name]).filter((id): id is string => Boolean(id)),
        ],
        tagList: [
          tagNames[genIndex % tagNames.length]!,
          tagNames[(genIndex + 3) % tagNames.length]!,
        ],
        intro: `Chuyên mục nhỏ trong chủ đề này. ${title}.`,
      });
      genIndex += 1;
    });
  }

  /* Sinh hàng loạt bài viết cho toàn bộ section & topic — dữ liệu lớn để test infinite scroll */
  const BULK_COUNT = 300;
  const allSectionKeys = Object.keys(sections);
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
      section: allSectionKeys[i % allSectionKeys.length]!,
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
      section: "y-tuong-song",
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
      section: "y-tuong-song",
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
      section: "y-tuong-song",
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
      section: "y-tuong-song",
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
      section: "meo-nho",
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
      section: "meo-nho",
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
      section: "meo-nho",
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
      section: "cau-chuyen",
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
      section: "cau-chuyen",
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
      section: "cau-chuyen",
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
      section: "y-tuong-song",
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
      section: "meo-nho",
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

  /* Sinh ~200 bài viết cho MỖI section để test trang chi tiết section (infinite scroll) */
  console.log("[seed] Creating ~200 posts per section...");
  const POSTS_PER_SECTION = 10;
  const sectionPostSubjects = [
    "Mẹo vặt hàng ngày", "Kinh nghiệm thực tế", "Checklist chuẩn bị",
    "So sánh các cách", "Lần đầu thử nghiệm", "Sai lầm thường gặp",
    "Bài học rút ra", "Mẹo tiết kiệm", "Cải thiện thói quen",
    "Tổng kết sau 30 ngày",
  ];
  const sectionPostAngles = [
    "cho người mới bắt đầu", "kinh nghiệm 1 năm", "phiên bản nâng cấp",
    "áp dụng thực tế", "chi tiết từng bước", "mẹo nhỏ nhưng hiệu quả",
    "từ A đến Z", "dành cho người bận rộn", "tiết kiệm thời gian",
    "hiệu quả bất ngờ",
  ];

  const sectionKeysForPosts = Object.keys(sections);
  let sectionPostIdx = 0;
  for (const sectionKey of sectionKeysForPosts) {
    const topicId = topicIdList[sectionPostIdx % topicIdList.length]!;
    for (let i = 0; i < POSTS_PER_SECTION; i += 1) {
      const subject = sectionPostSubjects[i % sectionPostSubjects.length]!;
      const angle = sectionPostAngles[(i * 3 + sectionPostIdx) % sectionPostAngles.length]!;
      const title = `${subject} ${angle} — ${sectionKey}`;
      postDefs.push({
        title,
        excerpt: `${title}. Bài viết chuyên sâu thuộc chuyên mục ${sectionKey}.`,
        section: sectionKey,
        authorIdx: (sectionPostIdx + i) % authors.length,
        status: i % 15 === 14 ? "draft" : "published",
        daysAgo: 1 + ((sectionPostIdx * 7 + i * 3) % 90),
        likes: 50 + ((sectionPostIdx * 13 + i * 97) % 800),
        bookmarks: 20 + ((sectionPostIdx * 7 + i * 43) % 200),
        topics: [topicId],
        tagList: [
          tagNames[i % tagNames.length]!,
          tagNames[(i + 5) % tagNames.length]!,
        ],
        intro: `Bài viết chia sẻ kinh nghiệm về ${subject.toLowerCase()}. ${angle}.`,
      });
    }
    sectionPostIdx += 1;
  }

  const createdPosts: { id: string; slug: string }[] = [];

  for (const [i, def] of postDefs.entries()) {
    const createdDate = new Date(Date.now() - def.daysAgo * 24 * 3600 * 1000);
    const slugBase = def.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const post = await prisma.post.create({
      data: {
        title: def.title,
        slug: `${slugBase}-${(i + 1).toString(36)}`,
        excerpt: def.excerpt,
        cover: `https://picsum.photos/seed/post-${i + 1}/1280/670`,
        bodyBlocks: richBlocks(i, def.intro) as unknown as Prisma.InputJsonValue[],
        status: def.status === "published" ? "PUBLISHED" : "DRAFT",
        likes: def.likes,
        bookmarks: def.bookmarks,
        sectionId: sections[def.section]!,
        authorId: authors[def.authorIdx]!.id,
        createdAt: createdDate,
        updatedAt: createdDate,
        ...(def.topics.length ? { topics: { connect: def.topics.map((id) => ({ id })) } } : {}),
        ...(def.tagList.length ? { tags: { connect: def.tagList.map((name) => ({ id: tags[name]! })) } } : {}),
      },
      select: { id: true, slug: true },
    });

    createdPosts.push(post);
  }

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

  /* Tạo commenters từ guestNames */
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

  /* Dữ liệu test: mỗi bài ~15 comment cha + 10 reply */
  const COMMENTS_PER_POST = 15;
  const REPLIES_PER_POST = 10;

  for (const [postIdx, post] of createdPosts.entries()) {
    const parentRows = Array.from({ length: COMMENTS_PER_POST }, (_, i) => {
      const commenter = commenters[i % commenters.length]!;
      return {
        postId: post.id,
        commenterId: commenter.id,
        content: commentPool[i % commentPool.length]!,
        createdAt: new Date(Date.now() - ((postIdx * COMMENTS_PER_POST + i * 7) % 180) * 24 * 3600 * 1000),
      };
    });

    /* createManyAndReturn trả về id để gắn reply vào đúng comment cha */
    const createdParents = await prisma.comment.createManyAndReturn({
      data: parentRows,
      select: { id: true },
    });

    const replyRows = Array.from({ length: REPLIES_PER_POST }, (_, i) => ({
      postId: post.id,
      parentId: createdParents[i % createdParents.length]!.id,
      commenterId: commenters[(i + 2) % commenters.length]!.id,
      content: replyPool[i % replyPool.length]!,
      createdAt: new Date(Date.now() - ((i * 5) % 150) * 24 * 3600 * 1000),
    }));
    await prisma.comment.createMany({ data: replyRows });

    /* Thả vài reaction cho bài đầu tiên */
    if (postIdx === 0) {
      await prisma.commentReaction.createMany({
        data: createdParents.slice(0, 10).map((c, i) => ({
          commentId: c.id,
          userId: admin.id,
          emoji: i % 2 ? "❤️" : "👍",
        })),
      });
    }
  }

  console.log(
    `[seed] Created ${createdPosts.length * (COMMENTS_PER_POST + REPLIES_PER_POST)} comments`
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
