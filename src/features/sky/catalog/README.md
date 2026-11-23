# Sky Viewer catalog extracts

- **Bright stars** uses the 80 brightest distinct Hipparcos entries with a proper name in the [HYG Database v4.1 by David Nash and contributors](https://github.com/astronexus/HYG-Database/blob/main/hyg/CURRENT/hygdata_v41.csv). The extract keeps J2000 right ascension in hours and declination in degrees, visual magnitude, and estimated distance converted from parsecs to light-years. The source CSV SHA-256 is `d9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd`.
- **Messier objects** uses coordinates for M8, M13, M31, M33, M42, and M51 from the [OpenNGC catalog by Mattia Verga](https://github.com/mattiaverga/OpenNGC/blob/master/database_files/NGC.csv). Coordinates were converted from sexagesimal to decimal units. The source CSV SHA-256 is `54abea0b57b0a103831bfc7a8e3a99a23acfbf4bb581fcf3d8af539cbb826c84`.

The two adapted data extracts are distributed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). For upstream acknowledgements, see [HYG data notes](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md) and [OpenNGC data sources](https://github.com/mattiaverga/OpenNGC#data-sources).
