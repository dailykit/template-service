# Template Engine

> A service that provides templates for KOT, Label, Receipts etc and sends response in format of either HTML or PDF.

### Templates
**Receipts**
- bill
  - bill1
    - [x] customer, restaurant address
    - [x] ordered items list with prices
    - [x] charges breakdown
    - [x] restaurant branding.

- label
  - sachet1
    - [x] order id
    - [x] product id
    - [x] recipe name
    - [x] sachet quantity
    - [x] sachet QR code
  - mealkit_product1
    - [x] order id
    - [x] product id
    - [x] recipe name
    - [x] servings
    - [x] product QR code
  - inventory_product1
    - [x] order id
    - [x] product id
    - [x] product name
    - [x] quantity
    - [x] product QR code
  - readytoeat_product1
    - [x] order id
    - [x] product id
    - [x] recipe name
    - [x] servings
    - [x] product QR code
- KOT
  - product_kot1
    - [x] order id
    - [x] customer details
    - [x] fulfillment type
    - [x] ready by time
    - [x] cases
      - [x] single station
        - [x] single product type
        - [x] multiple product type
      - [x] multiple station
        - [x] single product type
        - [x] multiple product type
  - sachet_kot1
    - [x] order id
    - [x] customer details
    - [x] fulfillment type
    - [x] ready by time
    - [x] cases
      - [x] single station
      - [x] multiple station