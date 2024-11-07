import { z } from "zod";
import { DEFAULT_SELECT_VALUE, DELIVERY_OPTIONS } from "../constants.js";
import dayjs from "dayjs";

const deliveryOptionEnum = z.enum(Object.values(DELIVERY_OPTIONS));

const productListSchema = z.array(
  z.object({
    id: z.number().int(),
    name: z.string().min(1),
    image: z.string().url(),
    price: z.number().positive(),
    quantity: z.number().int().positive().min(1),
  })
);

const checkoutDataSchema = z.object({
  email: z.string().email(),
  deliveryOption: deliveryOptionEnum,
  country: z
    .string()
    .min(1)
    .refine((value) => value !== DEFAULT_SELECT_VALUE),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dni: z.string().regex(/^\d{8}$/),
  address: z.string().min(1),
  department: z
    .string()
    .min(1)
    .refine((value) => value !== DEFAULT_SELECT_VALUE),
  province: z
    .string()
    .min(1)
    .refine((value) => value !== DEFAULT_SELECT_VALUE),
  district: z
    .string()
    .min(1)
    .refine((value) => value !== DEFAULT_SELECT_VALUE),
  cellPhone: z.string().regex(/^\d{9}$/),
  paymentOption: z.string().min(1),
  // Agregando las propiedades idOrder, idPayment y orderDate
  idOrder: z.preprocess(() => crypto.randomUUID(), z.string()),
  idPayment: z.preprocess(() => crypto.randomUUID(), z.string()),
  orderDate: z.preprocess(
    () => dayjs().format("YYYY-MM-DD HH:mm:ss"),
    z.string()
  ),
});

export const validateProductList = (productList) => {
  return productListSchema.safeParse(productList);
};

export const validateCheckoutData = (checkoutData, selectedDelivery) => {
  const selectedDeliveryValidated =
    deliveryOptionEnum.safeParse(selectedDelivery);

  if (!selectedDeliveryValidated.success) {
    return selectedDeliveryValidated;
  }

  if (selectedDelivery === DELIVERY_OPTIONS.PICK_UP) {
    const deliverySchema = checkoutDataSchema.omit({
      country: true,
      address: true,
      department: true,
      province: true,
      district: true,
    });

    return deliverySchema.safeParse(checkoutData);
  }

  return checkoutDataSchema.safeParse(checkoutData);
};
