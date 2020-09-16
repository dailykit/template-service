# Template Engine

> A service that provides templates for KOT, Label, Receipts etc and sends response in format of either HTML or PDF.

### Templates
**Receipts**
- bill
  - bill1
    - customer, restaurant address
    - ordered items list with prices
    - charges breakdown
    - restaurant branding.

- label
  - sachet1
    - order id
    - product id
    - recipe name
    - sachet quantity
    - sachet QR code
  - mealkit_product1
    - order id
    - product id
    - recipe name
    - servings
    - product QR code
  - inventory_product1
    - order id
    - product id
    - product name
    - quantity
    - product QR code
  - readytoeat_product1
    - order id
    - product id
    - recipe name
    - servings
    - product QR code
- KOT
  - product_kot1
    - order id
    - customer details
    - fulfillment type
    - ready by time
    - cases
      - single station
        - single product type
        - multiple product type
      - multiple station
        - single product type
        - multiple product type