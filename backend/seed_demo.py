"""
סקריפט דמו — יוצר משתמשים פיקטיביים עם הזמנות מגוונות לבדיקת המיון וההדפסה.

שימוש:
  docker compose exec backend python seed_demo.py

מה זה עושה:
  1. יוצר 12 משתמשי דמו (6 בירושלים, 6 בבת ים)
  2. יוצר הזמנות מגוונות עם חפיפות מכוונות כדי לבדוק את אלגוריתם המיון
  3. יוצר גם פריטים בעגלה (ללא הזמנה) כדי לבדוק סטטוס "בעגלה"

למחיקת כל נתוני הדמו:
  docker compose exec backend python seed_demo.py --cleanup
"""
import asyncio
import sys
from decimal import Decimal
from app.db.database import async_session_maker
from app.domains.users.models import User, Region
from app.domains.orders.models import Order, OrderItem, Cart, CartItem
from app.domains.products.models import ColorSKU
from app.core.security import get_password_hash
from sqlalchemy import select, delete

DEMO_PASSWORD = get_password_hash("demo1234")
DEMO_EMAIL_SUFFIX = "@demo.test"

# === Demo users ===
DEMO_USERS = [
    # ---- ירושלים (region_id=2) ----
    {"first_name": "דוד",   "last_name": "כהן",    "phone": "050-1111111", "region_id": 2},
    {"first_name": "שרה",   "last_name": "לוי",     "phone": "050-2222222", "region_id": 2},
    {"first_name": "יוסף",  "last_name": "מזרחי",   "phone": "050-3333333", "region_id": 2},
    {"first_name": "רחל",   "last_name": "אברהם",   "phone": "050-4444444", "region_id": 2},
    {"first_name": "משה",   "last_name": "פרץ",     "phone": "050-5555555", "region_id": 2},
    {"first_name": "מרים",  "last_name": "דהן",     "phone": "050-6666666", "region_id": 2},
    # ---- בת ים (region_id=3) ----
    {"first_name": "אלי",   "last_name": "ביטון",   "phone": "052-1111111", "region_id": 3},
    {"first_name": "נועה",  "last_name": "שמעון",   "phone": "052-2222222", "region_id": 3},
    {"first_name": "עמית",  "last_name": "גולן",    "phone": "052-3333333", "region_id": 3},
    {"first_name": "תמר",   "last_name": "רוזן",    "phone": "052-4444444", "region_id": 3},
    {"first_name": "אורי",  "last_name": "חדד",     "phone": "052-5555555", "region_id": 3},
    {"first_name": "לירון", "last_name": "נחמיאס",  "phone": "052-6666666", "region_id": 3},
]

# SKU IDs from the database:
# 3  = בורקאד יהלום זהב
# 4  = כותנה אורגנית לבן שלג
# 5  = כותנה אורגנית שחור פחם
# 6  = כותנה חלקה כחול ים
# 8  = פשתן טבעי בז'
# 9  = משי יוקרתי זהב מלכותי

# === Orders per user (designed to create interesting overlaps) ===
# Users 0-5 are Jerusalem, Users 6-11 are Bat Yam
DEMO_ORDERS = {
    # ירושלים — cluster 1: דוד, שרה, יוסף share כותנה + בורקאד
    0: [  # דוד כהן
        {"status": "Received", "items": [
            {"sku_id": 3, "length": 3.0, "units": 2, "price": 75.0},   # בורקאד זהב
            {"sku_id": 4, "length": 5.0, "units": 1, "price": 45.5},   # כותנה לבן
            {"sku_id": 6, "length": 2.0, "units": 3, "price": 30.0},   # כותנה כחול
        ]},
    ],
    1: [  # שרה לוי
        {"status": "Received", "items": [
            {"sku_id": 3, "length": 4.0, "units": 1, "price": 75.0},   # בורקאד זהב (חפיפה עם דוד)
            {"sku_id": 4, "length": 2.5, "units": 2, "price": 45.5},   # כותנה לבן (חפיפה עם דוד)
            {"sku_id": 8, "length": 3.0, "units": 1, "price": 60.0},   # פשתן בז'
        ]},
    ],
    2: [  # יוסף מזרחי
        {"status": "Delivered", "items": [
            {"sku_id": 4, "length": 6.0, "units": 1, "price": 45.5},   # כותנה לבן (חפיפה עם דוד+שרה)
            {"sku_id": 6, "length": 3.5, "units": 2, "price": 30.0},   # כותנה כחול (חפיפה עם דוד)
        ]},
        {"status": "Received", "items": [
            {"sku_id": 3, "length": 1.5, "units": 4, "price": 75.0},   # בורקאד זהב (חפיפה עם דוד+שרה)
        ]},
    ],
    # ירושלים — cluster 2: רחל, משה share משי + פשתן
    3: [  # רחל אברהם
        {"status": "Received", "items": [
            {"sku_id": 9, "length": 2.0, "units": 1, "price": 120.0},  # משי זהב
            {"sku_id": 8, "length": 4.0, "units": 2, "price": 60.0},   # פשתן בז' (חפיפה עם שרה)
        ]},
    ],
    4: [  # משה פרץ
        {"status": "Received", "items": [
            {"sku_id": 9, "length": 3.0, "units": 2, "price": 120.0},  # משי זהב (חפיפה עם רחל)
            {"sku_id": 8, "length": 2.5, "units": 1, "price": 60.0},   # פשתן בז' (חפיפה עם רחל+שרה)
            {"sku_id": 5, "length": 1.5, "units": 3, "price": 45.5},   # כותנה שחור
        ]},
    ],
    # ירושלים — מרים: מבודדת (רק כותנה שחור)
    5: [  # מרים דהן
        {"status": "Received", "items": [
            {"sku_id": 5, "length": 7.0, "units": 1, "price": 45.5},   # כותנה שחור (חפיפה עם משה)
        ]},
    ],

    # בת ים — cluster 1: אלי, נועה, עמית share פשתן + כותנה כחול
    6: [  # אלי ביטון
        {"status": "Received", "items": [
            {"sku_id": 8, "length": 5.0, "units": 2, "price": 60.0},   # פשתן בז'
            {"sku_id": 6, "length": 3.0, "units": 1, "price": 30.0},   # כותנה כחול
            {"sku_id": 4, "length": 2.0, "units": 1, "price": 45.5},   # כותנה לבן
        ]},
    ],
    7: [  # נועה שמעון
        {"status": "Delivered", "items": [
            {"sku_id": 8, "length": 3.0, "units": 3, "price": 60.0},   # פשתן (חפיפה עם אלי)
            {"sku_id": 6, "length": 4.0, "units": 1, "price": 30.0},   # כותנה כחול (חפיפה עם אלי)
        ]},
    ],
    8: [  # עמית גולן
        {"status": "Received", "items": [
            {"sku_id": 6, "length": 2.0, "units": 2, "price": 30.0},   # כותנה כחול (חפיפה עם אלי+נועה)
            {"sku_id": 4, "length": 1.5, "units": 1, "price": 45.5},   # כותנה לבן (חפיפה עם אלי)
        ]},
    ],
    # בת ים — cluster 2: תמר, אורי share בורקאד + משי
    9: [  # תמר רוזן
        {"status": "Received", "items": [
            {"sku_id": 3, "length": 2.0, "units": 3, "price": 75.0},   # בורקאד זהב
            {"sku_id": 9, "length": 1.5, "units": 1, "price": 120.0},  # משי זהב
        ]},
    ],
    10: [  # אורי חדד
        {"status": "Received", "items": [
            {"sku_id": 3, "length": 4.0, "units": 1, "price": 75.0},   # בורקאד (חפיפה עם תמר)
            {"sku_id": 9, "length": 2.0, "units": 2, "price": 120.0},  # משי (חפיפה עם תמר)
            {"sku_id": 5, "length": 3.0, "units": 1, "price": 45.5},   # כותנה שחור
        ]},
    ],
    # בת ים — לירון: מבודד (רק כותנה שחור, ברוב הפריטים בעגלה)
    11: [],  # לירון — רק עגלה, בלי הזמנות
}

# Cart items (users who have items still in cart)
DEMO_CARTS = {
    0: [  # דוד — גם פריטים בעגלה
        {"sku_id": 9, "length": 1.5, "units": 1},   # משי זהב
    ],
    3: [  # רחל — עוד משהו בעגלה
        {"sku_id": 4, "length": 3.0, "units": 1},   # כותנה לבן
    ],
    11: [  # לירון — רק עגלה, בלי הזמנות
        {"sku_id": 5, "length": 4.0, "units": 2},   # כותנה שחור
        {"sku_id": 8, "length": 2.0, "units": 1},   # פשתן בז'
    ],
    7: [  # נועה — עוד משהו בעגלה
        {"sku_id": 3, "length": 2.0, "units": 1},   # בורקאד זהב
    ],
}


async def seed():
    async with async_session_maker() as session:
        created_users = []

        for i, u in enumerate(DEMO_USERS):
            email = f"demo{i+1}{DEMO_EMAIL_SUFFIX}"

            # Check if already exists
            existing = (await session.execute(
                select(User).where(User.email == email)
            )).scalars().first()
            if existing:
                print(f"  ⏭️  {u['first_name']} {u['last_name']} כבר קיים (id={existing.id})")
                created_users.append(existing)
                continue

            user = User(
                email=email,
                first_name=u["first_name"],
                last_name=u["last_name"],
                phone=u["phone"],
                region_id=u["region_id"],
                hashed_password=DEMO_PASSWORD,
                is_active=True,
                is_superuser=False,
            )
            session.add(user)
            await session.flush()
            created_users.append(user)
            print(f"  ✅ נוצר: {u['first_name']} {u['last_name']} (id={user.id}, אזור={u['region_id']})")

        # Create orders
        for user_idx, orders in DEMO_ORDERS.items():
            user = created_users[user_idx]
            for order_data in orders:
                total = Decimal("0.00")
                order_items = []
                for item in order_data["items"]:
                    line_total = Decimal(str(item["price"])) * Decimal(str(item["length"])) * item["units"]
                    total += line_total
                    order_items.append(OrderItem(
                        color_sku_id=item["sku_id"],
                        length_meters=Decimal(str(item["length"])),
                        units=item["units"],
                        price_at_purchase=Decimal(str(item["price"])),
                    ))
                order = Order(
                    user_id=user.id,
                    status=order_data["status"],
                    total_price=total,
                    items=order_items,
                )
                session.add(order)
            if orders:
                print(f"  📦 {len(orders)} הזמנות ל-{DEMO_USERS[user_idx]['first_name']} {DEMO_USERS[user_idx]['last_name']}")

        # Create cart items
        for user_idx, cart_items in DEMO_CARTS.items():
            user = created_users[user_idx]
            # Check if cart exists
            cart = (await session.execute(
                select(Cart).where(Cart.user_id == user.id)
            )).scalars().first()
            if not cart:
                cart = Cart(user_id=user.id)
                session.add(cart)
                await session.flush()

            for ci in cart_items:
                item = CartItem(
                    cart_id=cart.id,
                    color_sku_id=ci["sku_id"],
                    length_meters=Decimal(str(ci["length"])),
                    units=ci["units"],
                )
                session.add(item)
            print(f"  🛒 {len(cart_items)} פריטים בעגלה של {DEMO_USERS[user_idx]['first_name']} {DEMO_USERS[user_idx]['last_name']}")

        await session.commit()
        print("\n🎉 נתוני הדמו נוצרו בהצלחה!")
        print(f"   {len(created_users)} משתמשים")
        print(f"   {sum(len(o) for o in DEMO_ORDERS.values())} הזמנות")
        print(f"   {sum(len(c) for c in DEMO_CARTS.values())} פריטים בעגלות")


async def cleanup():
    async with async_session_maker() as session:
        demo_users = (await session.execute(
            select(User).where(User.email.like(f"%{DEMO_EMAIL_SUFFIX}"))
        )).scalars().all()

        if not demo_users:
            print("אין נתוני דמו למחיקה.")
            return

        for user in demo_users:
            # Orders and cart will cascade-delete
            await session.delete(user)
            print(f"  🗑️  נמחק: {user.first_name} {user.last_name}")

        await session.commit()
        print(f"\n✅ {len(demo_users)} משתמשי דמו נמחקו בהצלחה!")


if __name__ == "__main__":
    if "--cleanup" in sys.argv:
        print("🧹 מנקה נתוני דמו...")
        asyncio.run(cleanup())
    else:
        print("🌱 יוצר נתוני דמו...")
        asyncio.run(seed())
