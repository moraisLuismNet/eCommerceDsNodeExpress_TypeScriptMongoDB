import Cart, { ICart, ICartItem } from "../models/Cart";
import User from "../models/User";
import Record, { IRecord } from "../models/Record";
import Group, { IGroup } from "../models/Group"; 
import mongoose, { Types } from "mongoose";

interface PopulatedCartItem extends Omit<ICartItem, "recordId"> {
  recordId: IRecord;
}

interface PopulatedCart extends Omit<ICart, "items"> {
  items: PopulatedCartItem[];
}

export interface ICartService {
  getCartByUserId(userId: string): Promise<ICart | null>;
  createCart(userId: string | Types.ObjectId): Promise<ICart>;
  addItemToCart(
    userId: string,
    recordId: string,
    amount: number,
    userEmail: string
  ): Promise<ICart>;
  removeItemFromCart(userId: string, recordId: string): Promise<ICart>;
  clearCart(userId: string): Promise<ICart>;
  disableCart(userId: string): Promise<ICart>;
  getAllCarts(): Promise<any[]>;
  removeItemFromCartByEmail(
    email: string,
    recordId: string,
    amount: number
  ): Promise<ICart>;
  getCartByEmail(email: string): Promise<ICart | null>;
}

async function getCartByUserId(userId: string): Promise<ICart | null> {
  const cart = await Cart.findOne({ userId, enabled: true })
    .populate({
      path: "items.recordId",
      model: "Record",
      select: "title imageRecord price stock Group", // Add Group here (the reference to the Group model)
      populate: {
        path: "Group", // Populate the Group object within the Record
        model: "Group",
        select: "_id nameGroup", // Select both _id and nameGroup
      },
    })
    .populate({
      path: "userId",
      model: "User",
      select: "userEmail",
    })
    .select("-__v -createdAt -updatedAt") // Explicitly exclude these fields
    .lean({ virtuals: true })
    .exec();

  if (cart) {
    const items =
      cart.items?.map((item) => {
        const record = item.recordId as unknown as IRecord;
        // Cast record.Group to IGroup for type safety before accessing its properties
        const group = record.Group as unknown as IGroup | null;
        return {
          _id: item._id,
          recordId: record._id,
          amount: item.amount,
          price: item.price,
          recordDetails: {
            title: record.title,
            image: record.imageRecord,
            price: record.price,
            stock: record.stock,
            GroupId: group?._id || null, // Access _id from the populated group
            nameGroup: group?.nameGroup || "", // Access nameGroup from the populated group
          },
        };
      }) || [];

    // Use the cart's userEmail if it exists, otherwise get it from the populated user
    let userEmail = cart.userEmail;
    if (
      !userEmail &&
      typeof cart.userId === "object" &&
      cart.userId !== null &&
      "userEmail" in cart.userId
    ) {
      userEmail = (cart.userId as { userEmail: string }).userEmail;
    }

    const userId =
      typeof cart.userId === "object" &&
      cart.userId !== null &&
      "_id" in cart.userId
        ? (cart.userId as { _id: Types.ObjectId })._id
        : cart.userId;

    return {
      ...cart,
      items,
      userEmail,
      userId,
    } as unknown as ICart;
  }

  return cart;
}

async function createCart(userId: string | Types.ObjectId): Promise<ICart> {
  // Convert userId to ObjectId if necessary
  const userIdObj =
    typeof userId === "string" ? new Types.ObjectId(userId) : userId;

  // Verify if the user exists
  const user = await User.findById(userIdObj);
  if (!user) {
    throw new Error("User not found");
  }

  // Verify if an active cart already exists
  const existingCart = await Cart.findOne({ userId: userIdObj, enabled: true });
  if (existingCart) {
    return existingCart;
  }

  // Verify if a disabled cart exists
  const disabledCart = await Cart.findOne({
    userId: userIdObj,
    enabled: false,
  });
  if (disabledCart) {
    disabledCart.enabled = true;
    disabledCart.items = [];
    disabledCart.totalPrice = 0;
    await disabledCart.save();
    return disabledCart;
  }

  // Create a new cart
  const newCart = new Cart({
    userId: userIdObj,
    items: [],
    totalPrice: 0,
    enabled: true,
  });

  await newCart.save();

  // Update the user with the new cartId
  await User.findByIdAndUpdate(userIdObj, { $set: { cartId: newCart._id } });

  return newCart;
}

async function addItemToCart(
  userId: string,
  recordId: string,
  amount: number,
  userEmail: string
): Promise<ICart> {
  try {
    // First check if record exists and has enough stock
    const record = await Record.findById(recordId).exec();
    if (!record) {
      throw new Error("Record not found");
    }

    const currentStock = record.stock;

    if (currentStock < amount) {
      throw new Error("Not enough stock");
    }

    // Convert userId to ObjectId for consistent comparison
    const userIdObj = new mongoose.Types.ObjectId(userId);

    // Find or create cart for user
    let cart = await Cart.findOne({ userId: userIdObj, enabled: true });

    if (!cart) {
      // Check if there's a disabled cart for this user
      const disabledCart = await Cart.findOne({ userId: userIdObj, enabled: false });
      
      if (disabledCart) {
        // Re-enable the existing cart
        disabledCart.enabled = true;
        disabledCart.items = []; // Clear existing items
        disabledCart.totalPrice = 0; // Reset total price
        cart = disabledCart;
      } else {
        cart = new Cart({
          userId: userIdObj,
          items: [],
          totalPrice: 0,
          enabled: true,
          userEmail: userEmail 
        });
      }
    } 

    // Ensure cart.items is initialized
    if (!cart.items) {
      cart.items = [];
    }

    const recordPrice = record.price || 0;
    const recordTitle = record.title || "Untitled";
    const recordImage = record.imageRecord || "";

    // Find the item in the cart
    const existingItemIndex = cart.items.findIndex(
      (item: any) => item.recordId && item.recordId.toString() === recordId
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      const existingItem = cart.items[existingItemIndex];
      existingItem.amount += amount;
      existingItem.price = recordPrice;

      // Ensure recordDetails has all required fields
      existingItem.recordDetails = {
        title: recordTitle,
        image: recordImage,
      };
    } else {
      // Add new item
      const newItem = {
        recordId: record._id,
        amount: amount,
        price: recordPrice,
        recordDetails: {
          title: recordTitle,
          image: recordImage,
        },
      };
      cart.items.push(newItem as any);
    }

    // Recalculate total price
    cart.totalPrice = cart.items.reduce((total: number, item: any) => {
      const itemAmount = Number(item.amount) || 0;
      const itemPrice = Number(item.price) || 0;
      return total + itemAmount * itemPrice;
    }, 0);

    // Round to 2 decimal places
    cart.totalPrice = Math.round(cart.totalPrice * 100) / 100;

    // Decrease stock
    record.stock -= amount;
    await record.save();

    // Save the cart
    const savedCart = await cart.save();

    // Return the populated cart with user details
    const result = await Cart.findById(savedCart._id)
      .populate("items.recordId")
      .populate("userId", "userEmail") // Only select the email field from user
      .lean()
      .exec();

    if (!result) {
      throw new Error("Failed to retrieve updated cart");
    }

    // Remove the redundant userEmail field if it exists
    if ("userEmail" in result) {
      delete result.userEmail;
    }

    return result as unknown as ICart;
  } catch (error) {
    console.error("Error in addItemToCart:", error);
    throw error;
  }
}

async function getCartByEmail(email: string): Promise<ICart | null> {
  try {
    const user = await User.findOne({ userEmail: email });
    if (!user) {
      return null; // Or throw an error if you prefer
    }
    return getCartByUserId(user._id.toString());
  } catch (error) {
    console.error("Error in getCartByEmail service:", error);
    throw error;
  }
}

async function removeItemFromCartByEmail(
  email: string,
  recordId: string,
  amount: number
): Promise<ICart> {
  try {
    const user = await User.findOne({ userEmail: email });
    if (!user) {
      throw new Error("User not found with this email");
    }

    const cart = await Cart.findOne({ userId: user._id, enabled: true });
    if (!cart) {
      throw new Error("Cart not found for this user");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.recordId.toString() === recordId
    );
    if (itemIndex === -1) {
      throw new Error("Item not found in cart");
    }

    const itemToRemove = cart.items[itemIndex];

    if (itemToRemove.amount < amount) {
      throw new Error("Cannot remove more items than are in the cart");
    }

    // Update stock
    const record = await Record.findById(recordId);
    if (record) {
      record.stock += amount;
      await record.save();
    }

    if (itemToRemove.amount === amount) {
      cart.items.splice(itemIndex, 1);
    } else {
      itemToRemove.amount -= amount;
    }

    cart.recalculateTotal();
    await cart.save();

    return getCartByUserId(cart.userId.toString()) as Promise<ICart>;
  } catch (error) {
    console.error("Error in removeItemFromCartByEmail service:", error);
    throw error;
  }
}

async function removeItemFromCart(
  userId: string,
  recordId: string
): Promise<ICart> {
  const cart = await Cart.findOne({ userId, enabled: true });
  if (!cart) {
    throw new Error("Cart not found");
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.recordId.toString() === recordId
  );
  if (itemIndex === -1) {
    throw new Error("Item not found in cart");
  }

  const removedItem = cart.items[itemIndex];

  // Get current stock value using findOne to handle both cases
  const record = await Record.findOne({ _id: recordId });
  if (record) {
    // Get current stock value, handling both 'stock' and 'Stock' fields
    const currentStock =
      (record as any).stock !== undefined
        ? (record as any).stock
        : (record as any).Stock || 0;

    // Update stock using updateOne
    await Record.updateOne(
      { _id: recordId },
      {
        $set: { stock: currentStock + removedItem.amount },
        $unset: { Stock: 1 }, // Remove the Stock field if it exists
      }
    );
  }

  // Remove item from cart
  cart.items.splice(itemIndex, 1);
  cart.recalculateTotal();
  await cart.save();

  // Return the populated cart
  return getCartByUserId(userId) as Promise<ICart>;
}

async function clearCart(userId: string): Promise<ICart> {
  let cart = await Cart.findOne({ userId, enabled: true });
  
  if (!cart) {
    // If no cart exists, create a new empty one
    return createCart(new mongoose.Types.ObjectId(userId));
  }

  // Return stock for all items
  for (const item of cart.items) {
    const record = await Record.findById(item.recordId);
    if (record) {
      record.Stock += item.amount;
      await record.save();
    }
  }

  // Clear the cart items but keep the cart document
  cart.items = [];
  cart.recalculateTotal();
  await cart.save();

  // Return the populated cart
  return getCartByUserId(userId) as Promise<ICart>;
}

async function disableCart(userId: string): Promise<ICart> {
  const cart = await Cart.findOne({ userId, enabled: true });
  if (!cart) {
    throw new Error("Cart not found");
  }

  await clearCart(userId); // Clear items and return stock first

  cart.enabled = false;
  await cart.save();
  return cart;
}

type CartWithPopulatedItems = Omit<ICart, "items"> & {
  items: Array<
    Omit<ICartItem, "recordId"> & {
      recordId: IRecord;
    }
  >;
};

async function getAllCarts(): Promise<any[]> {
  try {
    const carts = await Cart.find({ enabled: true })
      .populate({
        path: "items.recordId",
        model: "Record",
        select: "title imageRecord price stock",
      })
      .populate({
        path: "userId",
        model: "User",
        select: "userEmail",
      })
      .select("-__v -createdAt -updatedAt")
      .lean({ virtuals: true })
      .exec();

    return carts.map((cartDoc) => {
      // Process items with proper type safety
      const items = (cartDoc.items || []).map((item) => {
        // If recordId is populated, use it to get record details
        if (item.recordId && typeof item.recordId === "object") {
          const record = item.recordId as unknown as IRecord;
          return {
            _id: item._id,
            recordId: record._id,
            amount: item.amount || 0,
            price: item.price || 0,
            recordDetails: {
              title: record.title || "No title",
              image: record.imageRecord || "",
              price: record.price || 0,
              stock: record.stock || 0,
            },
          };
        }

        // If recordId is not populated, use existing recordDetails or empty object
        return {
          _id: item._id,
          recordId: item.recordId,
          amount: item.amount || 0,
          price: item.price || 0,
          recordDetails: item.recordDetails || {
            title: "Unknown",
            image: "",
            price: 0,
            stock: 0,
          },
        };
      });

      // Use the cart's userEmail if it exists, otherwise get it from the populated user
      const userEmail =
        cartDoc.userEmail ||
        (cartDoc.userId &&
        typeof cartDoc.userId === "object" &&
        "userEmail" in cartDoc.userId
          ? (cartDoc.userId as { userEmail: string }).userEmail
          : null);

      // Return the cart with processed items
      return {
        _id: cartDoc._id,
        userId: cartDoc.userId,
        userEmail: userEmail,
        items,
        totalPrice: cartDoc.totalPrice || 0,
        enabled: cartDoc.enabled !== false, // Default to true if not set
      };
    });
  } catch (error) {
    console.error("Error fetching carts:", error);
    throw new Error("Failed to fetch carts");
  }
}

export default {
  getCartByUserId,
  createCart,
  addItemToCart,
  removeItemFromCart,
  clearCart,
  disableCart,
  getAllCarts,
  removeItemFromCartByEmail,
  getCartByEmail,
} as ICartService;
