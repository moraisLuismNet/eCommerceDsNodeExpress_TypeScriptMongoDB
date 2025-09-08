import Record, { IRecord } from "../models/Record";

export async function getAll(): Promise<IRecord[]> {
  return await Record.find().populate({
    path: "GroupId",
    select: "NameGroup",
  });
}

export async function getById(id: string): Promise<IRecord | null> {
  return await Record.findById(id);
}

export async function create(
  recordData: Omit<IRecord, "_id">
): Promise<IRecord> {
  return await Record.create(recordData);
}

export async function update(
  id: string,
  recordData: Partial<Omit<IRecord, "_id">>
): Promise<IRecord | null> {
  const updatedRecord = await Record.findByIdAndUpdate(id, recordData, {
    new: true,
  });
  return updatedRecord;
}

export async function remove(id: string): Promise<boolean> {
  const result = await Record.findByIdAndDelete(id);
  return result !== null;
}

export async function updateStock(
  id: string,
  amount: number
): Promise<{ newStock: number } | null> {
  try {
    console.log(`Updating stock for record ${id} with amount:`, amount);

    // First, get the document as a plain JavaScript object
    const record = await Record.findById(id).lean();
    console.log("Found record:", record);

    if (!record) {
      throw new Error(`Record with ID ${id} not found`);
    }

    // Always use 'stock' (lowercase) and remove 'Stock' (uppercase)
    const stockField = "stock";

    // Get the current stock value, checking both cases
    const currentStock =
      (record as any).stock !== undefined
        ? (record as any).stock
        : (record as any).Stock;

    console.log(`Current stock value:`, currentStock);

    if (typeof currentStock !== "number") {
      throw new Error(`Invalid stock value in the database: ${currentStock}`);
    }

    if (amount < 0 && Math.abs(amount) > currentStock) {
      throw new Error(
        `Cannot decrease stock by ${Math.abs(
          amount
        )} when current stock is ${currentStock}`
      );
    }

    const newStockValue = currentStock + amount;

    // Prepare the update operation to use 'stock' and remove 'Stock'
    const updateOps: any = {
      $set: { [stockField]: newStockValue },
      $unset: { Stock: 1 }, // Always remove the 'Stock' field
    };

    console.log("Update operations:", JSON.stringify(updateOps, null, 2));

    // Perform the update
    const result = await Record.updateOne({ _id: id }, updateOps);

    console.log("Update result:", result);

    return { newStock: newStockValue };
  } catch (error) {
    console.error("Error in updateStock:", error);
    throw error; // Re-throw to be handled by the controller
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  updateStock,
};
