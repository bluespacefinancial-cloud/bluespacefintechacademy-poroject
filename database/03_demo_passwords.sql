-- Demo account passwords (BlueSpace2026!). The public.users.password column
-- is write-only to API roles; see lms/database/01_schema.sql grants.
BEGIN;
UPDATE public.users u SET password = c.password FROM (VALUES
  ('697d87c5-b7cd-4a0d-bb13-1f55b6b1959c'::uuid, '$2a$06$Snus/rCCq.v10f7Aa4N9ku9pc90feUueHa9auPXVsqInxiWEZysVa'),
  ('07b27fe0-0269-4c45-957d-ba2a28661909'::uuid, '$2a$06$cb0DQrM5iaf7eJCh5GTpBuO9S5Tly2L0jHYNnuDhWTgZccbWUpMg6'),
  ('2c4f05d3-f8ed-4502-8ebc-6a89cadbe2af'::uuid, '$2a$06$RMvr2GZP3zCh7f9EhFhB6ebK8qbRbhvl3wn3IxGSfCAgq1Ffe.eyy'),
  ('b152782b-657c-4bfd-b3b7-b4f920226ff6'::uuid, '$2a$06$qTKCZWVkJDrdSDzDFZi8RuiY2NqAJ.QPbuolZ5k/wBvM9e5pD8fEq'),
  ('4b4452dc-daa1-4acc-bc6a-a0d3f6c67246'::uuid, '$2a$06$H20hQGQH6UNJoveyenlZt.cONYfGyo/Bb/Tsza9kUtPSmGlxyLHxa'),
  ('45e3aaaa-08c9-46af-84b1-27b78c2da597'::uuid, '$2a$06$edu./UPtvzIyotrWDhD5de0qFeA8HfvHoXM72XmoCH7l94jYOAhs.'),
  ('e2087cbc-4a81-4b83-a94b-b0ca661a0b66'::uuid, '$2a$06$dKPIZQNDLHA5Aics6/5nk.pZ.OKRN3D5DIzFy/STcxyXMWGQRZUAy'),
  ('8a27139a-721a-4592-b479-7dffb0bf5c13'::uuid, '$2a$06$N2cBhAIMFX8K4BSp/O6bTujY4VA4WZ./qhzmTGbRdbIEqXZmSEsnq'),
  ('1d2d2c2c-9ece-4391-bd4e-cf1ace4af14f'::uuid, '$2a$06$h1NZPr.9jZ2aWaaWkduLsuqVkIEEkiMR1JJ8VRJypFiLcE8SYpPjq'),
  ('e40b79f0-be38-4d81-a8a4-f2af1dc9eacb'::uuid, '$2a$06$vD0QhBToA1W03JroYjD3Je9MFro36WcLDGS.4o/f/w3./obdBajue'),
  ('fd2e47bb-61e9-4575-9269-19dced9e00da'::uuid, '$2a$06$To9N72dgB6604jKTV.pOe.ZxuB63S4c0Xx0FcWRfktDDRqPPHM/Xi')
) AS c(auth_user_id, password) WHERE u.auth_user_id = c.auth_user_id;
COMMIT;
