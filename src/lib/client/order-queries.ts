import { graphql } from "../../graphql/graphql";

export const ActiveOrderFragment = graphql(`
  fragment ActiveOrder on Order @_unmask {
    __typename
    id
    code
    state
    currencyCode
    totalQuantity
    subTotalWithTax
    shippingWithTax
    totalWithTax
    customer {
      id
      emailAddress
      firstName
      lastName
      phoneNumber
    }
    lines {
      id
      unitPriceWithTax
      quantity
      linePriceWithTax
      productVariant {
        id
        name
        sku
      }
      featuredAsset {
        id
        preview
      }
    }
    discounts {
      type
      description
      amountWithTax
    }
    couponCodes
    shippingLines {
      id
      priceWithTax
      shippingMethod {
        id
        name
      }
    }
    shippingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country
      countryCode
      phoneNumber
    }
    billingAddress {
      fullName
      company
      streetLine1
      streetLine2
      city
      province
      postalCode
      country
      countryCode
      phoneNumber
    }
  }
`);

export const ActiveOrderQuery = graphql(
  `
    query GetActiveOrder {
      activeOrder {
        ...ActiveOrder
      }
    }
  `,
  [ActiveOrderFragment],
);

export const AddItemToOrderMutation = graphql(
  `
    mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
      addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const AdjustOrderLineMutation = graphql(
  `
    mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
      adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const ApplyCouponCodeMutation = graphql(
  `
    mutation ApplyCouponCode($couponCode: String!) {
      applyCouponCode(couponCode: $couponCode) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const RemoveCouponCodeMutation = graphql(
  `
    mutation RemoveCouponCode($couponCode: String!) {
      removeCouponCode(couponCode: $couponCode) {
        ...ActiveOrder
      }
    }
  `,
  [ActiveOrderFragment],
);

export const SetCustomerForOrderMutation = graphql(
  `
    mutation SetCustomerForOrder($input: CreateCustomerInput!) {
      setCustomerForOrder(input: $input) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const SetOrderShippingAddressMutation = graphql(
  `
    mutation SetOrderShippingAddress($input: CreateAddressInput!) {
      setOrderShippingAddress(input: $input) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const EligibleShippingMethodsQuery = graphql(`
  query EligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      priceWithTax
      description
    }
  }
`);

export const SetOrderShippingMethodMutation = graphql(
  `
    mutation SetOrderShippingMethod($id: [ID!]!) {
      setOrderShippingMethod(shippingMethodId: $id) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const TransitionOrderToStateMutation = graphql(
  `
    mutation TransitionOrderToState($state: String!) {
      transitionOrderToState(state: $state) {
        ...ActiveOrder
        ... on OrderStateTransitionError {
          errorCode
          message
          transitionError
          fromState
          toState
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const AddPaymentToOrderMutation = graphql(
  `
    mutation AddPaymentToOrder($input: PaymentInput!) {
      addPaymentToOrder(input: $input) {
        ...ActiveOrder
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [ActiveOrderFragment],
);

export const EligiblePaymentMethodsQuery = graphql(`
  query EligiblePaymentMethods {
    eligiblePaymentMethods {
      id
      name
      code
      isEligible
    }
  }
`);

export const OrderByCodeQuery = graphql(
  `
    query GetOrderByCode($code: String!) {
      orderByCode(code: $code) {
        ...ActiveOrder
      }
    }
  `,
  [ActiveOrderFragment],
);

export const CreateMolliePaymentIntentMutation = graphql(`
  mutation CreateMolliePaymentIntent($input: MolliePaymentIntentInput!) {
    createMolliePaymentIntent(input: $input) {
      ... on MolliePaymentIntent {
        url
      }
      ... on MolliePaymentIntentError {
        errorCode
        message
      }
    }
  }
`);
