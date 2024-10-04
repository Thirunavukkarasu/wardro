# Wardro

# SQL Scripts

1. Users

```
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    clerk_id VARCHAR(50) UNIQUE NOT NULL
);
```

2. Wardrobes

```
CREATE TABLE wardrobes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

3. Wardrobe Items

```
CREATE TABLE wardrobe_items (
    id SERIAL PRIMARY KEY,
    photo_uri TEXT,
    item_name VARCHAR(255) NOT NULL,
    purchase_date DATE,
    expiry_date DATE,
    price NUMERIC(10, 2),
    brand VARCHAR(255),
    category VARCHAR(255),
    color VARCHAR(100),
    size VARCHAR(50),
    wardrobe_id INT,
    user_id INT,
    state VARCHAR(50) DEFAULT 'newly_purchased', -- e.g., 'newly_purchased', 'in_use', 'faded', 'expired', 'archived'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wardrobe
        FOREIGN KEY (wardrobe_id)
        REFERENCES wardrobes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

4. Item Usage

```
CREATE TABLE items_usage (
    id SERIAL PRIMARY KEY,
    wardrobe_item_id INT NOT NULL,
    usage_date DATE NOT NULL,
    photo_uri TEXT,
    occasion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wardrobe_item
        FOREIGN KEY (wardrobe_item_id)
        REFERENCES wardrobe_items(id)
        ON DELETE CASCADE
);
```

5. Item Activity

```
CREATE TABLE item_activity (
    id SERIAL PRIMARY KEY,
    wardrobe_item_id INT NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- e.g., "used", "cleaned", "updated"
    activity_date DATE NOT NULL,
    description TEXT, -- Optional field to describe details about the activity
    photo_uri TEXT, -- Optional: used for tracking if an activity is associated with a photo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wardrobe_item
        FOREIGN KEY (wardrobe_item_id)
        REFERENCES wardrobe_items(id)
        ON DELETE CASCADE
);
```
