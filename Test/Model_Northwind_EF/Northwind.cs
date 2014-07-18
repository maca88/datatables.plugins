namespace Model_Northwind_EF
{
    using System;
    using System.Data.Entity;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Linq;

    public partial class Northwind : DbContext
    {
        public Northwind()
            : base("name=Northwind")
        {
        }

        public virtual DbSet<Categories> Categories { get; set; }
        public virtual DbSet<CustomerDemographics> CustomerDemographics { get; set; }
        public virtual DbSet<Customers> Customers { get; set; }
        public virtual DbSet<Employees> Employees { get; set; }
        public virtual DbSet<Order_Details> Order_Details { get; set; }
        public virtual DbSet<Orders> Orders { get; set; }
        public virtual DbSet<Products> Products { get; set; }
        public virtual DbSet<Region> Region { get; set; }
        public virtual DbSet<Shippers> Shippers { get; set; }
        public virtual DbSet<Suppliers> Suppliers { get; set; }
        public virtual DbSet<Territories> Territories { get; set; }
        public virtual DbSet<Alphabetical_list_of_products> Alphabetical_list_of_products { get; set; }
        public virtual DbSet<Category_Sales_for_1997> Category_Sales_for_1997 { get; set; }
        public virtual DbSet<Current_Product_List> Current_Product_List { get; set; }
        public virtual DbSet<Customer_and_Suppliers_by_City> Customer_and_Suppliers_by_City { get; set; }
        public virtual DbSet<Invoices> Invoices { get; set; }
        public virtual DbSet<Order_Details_Extended> Order_Details_Extended { get; set; }
        public virtual DbSet<Order_Subtotals> Order_Subtotals { get; set; }
        public virtual DbSet<Orders_Qry> Orders_Qry { get; set; }
        public virtual DbSet<Product_Sales_for_1997> Product_Sales_for_1997 { get; set; }
        public virtual DbSet<Products_Above_Average_Price> Products_Above_Average_Price { get; set; }
        public virtual DbSet<Products_by_Category> Products_by_Category { get; set; }
        public virtual DbSet<Sales_by_Category> Sales_by_Category { get; set; }
        public virtual DbSet<Sales_Totals_by_Amount> Sales_Totals_by_Amount { get; set; }
        public virtual DbSet<Summary_of_Sales_by_Quarter> Summary_of_Sales_by_Quarter { get; set; }
        public virtual DbSet<Summary_of_Sales_by_Year> Summary_of_Sales_by_Year { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CustomerDemographics>()
                .Property(e => e.CustomerTypeID)
                .IsFixedLength();

            modelBuilder.Entity<CustomerDemographics>()
                .HasMany(e => e.Customers)
                .WithMany(e => e.CustomerDemographics)
                .Map(m => m.ToTable("CustomerCustomerDemo").MapLeftKey("CustomerTypeID").MapRightKey("CustomerID"));

            modelBuilder.Entity<Customers>()
                .Property(e => e.CustomerID)
                .IsFixedLength();

            modelBuilder.Entity<Employees>()
                .HasMany(e => e.Employees1)
                .WithOptional(e => e.Employees2)
                .HasForeignKey(e => e.ReportsTo);

            modelBuilder.Entity<Employees>()
                .HasMany(e => e.Territories)
                .WithMany(e => e.Employees)
                .Map(m => m.ToTable("EmployeeTerritories").MapLeftKey("EmployeeID").MapRightKey("TerritoryID"));

            modelBuilder.Entity<Order_Details>()
                .Property(e => e.UnitPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Orders>()
                .Property(e => e.CustomerID)
                .IsFixedLength();

            modelBuilder.Entity<Orders>()
                .Property(e => e.Freight)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Orders>()
                .HasRequired(o => o.Customers)
                .WithMany(o => o.Orders)
                .HasForeignKey(o => o.CustomerID);

            modelBuilder.Entity<Orders>()
                .HasMany(e => e.Order_Details)
                .WithRequired(e => e.Orders)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<Products>()
                .Property(e => e.UnitPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Products>()
                .HasMany(e => e.Order_Details)
                .WithRequired(e => e.Products)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<Region>()
                .Property(e => e.RegionDescription)
                .IsFixedLength();

            modelBuilder.Entity<Region>()
                .HasMany(e => e.Territories)
                .WithRequired(e => e.Region)
                .WillCascadeOnDelete(false);

            modelBuilder.Entity<Shippers>()
                .HasMany(e => e.Orders)
                .WithOptional(e => e.Shippers)
                .HasForeignKey(e => e.ShipVia);

            modelBuilder.Entity<Territories>()
                .Property(e => e.TerritoryDescription)
                .IsFixedLength();

            modelBuilder.Entity<Alphabetical_list_of_products>()
                .Property(e => e.UnitPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Category_Sales_for_1997>()
                .Property(e => e.CategorySales)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Customer_and_Suppliers_by_City>()
                .Property(e => e.Relationship)
                .IsUnicode(false);

            modelBuilder.Entity<Invoices>()
                .Property(e => e.CustomerID)
                .IsFixedLength();

            modelBuilder.Entity<Invoices>()
                .Property(e => e.UnitPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Invoices>()
                .Property(e => e.ExtendedPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Invoices>()
                .Property(e => e.Freight)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Order_Details_Extended>()
                .Property(e => e.UnitPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Order_Details_Extended>()
                .Property(e => e.ExtendedPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Order_Subtotals>()
                .Property(e => e.Subtotal)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Orders_Qry>()
                .Property(e => e.CustomerID)
                .IsFixedLength();

            modelBuilder.Entity<Orders_Qry>()
                .Property(e => e.Freight)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Product_Sales_for_1997>()
                .Property(e => e.ProductSales)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Products_Above_Average_Price>()
                .Property(e => e.UnitPrice)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Sales_by_Category>()
                .Property(e => e.ProductSales)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Sales_Totals_by_Amount>()
                .Property(e => e.SaleAmount)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Summary_of_Sales_by_Quarter>()
                .Property(e => e.Subtotal)
                .HasPrecision(19, 4);

            modelBuilder.Entity<Summary_of_Sales_by_Year>()
                .Property(e => e.Subtotal)
                .HasPrecision(19, 4);
        }
    }
}
