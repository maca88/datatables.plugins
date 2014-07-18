using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Http.OData.Batch;
using System.Web.Http.OData.Builder;
using System.Web.Http.OData.Extensions;
using System.Web.Http.OData.Routing;
using System.Web.Http.OData.Routing.Conventions;
using System.Xml;
using Microsoft.Data.Edm;
using Model_Northwind_EF;

[assembly: WebActivator.PostApplicationStartMethod(
    typeof(NorthBreeze.App_Start.ODataConfig), "RegistePreStart")]
namespace NorthBreeze.App_Start
{
    public class ODataConfig
    {
        public static void RegistePreStart()
        {
            // New code:
            
            ODataModelBuilder builder = new ODataConventionModelBuilder();
            builder.EntitySet<Categories>("Categories");
            builder.EntitySet<CustomerDemographics>("CustomerDemographics");
            builder.EntitySet<Customers>("Customers");
            builder.EntitySet<Employees>("Employees");
            builder.EntitySet<Order_Details>("Order_Details");
            builder.EntitySet<Orders>("Orders");
            builder.EntitySet<Products>("Products");
            builder.EntitySet<Region>("Region");
            builder.EntitySet<Shippers>("Shippers");
            builder.EntitySet<Suppliers>("Suppliers");
            builder.EntitySet<Territories>("Territories");
            builder.EntitySet<Alphabetical_list_of_products>("Alphabetical_list_of_products");
            builder.EntitySet<Category_Sales_for_1997>("Category_Sales_for_1997");
            builder.EntitySet<Current_Product_List>("Current_Product_List");
            builder.EntitySet<Customer_and_Suppliers_by_City>("Customer_and_Suppliers_by_City");
            builder.EntitySet<Invoices>("Invoices");
            builder.EntitySet<Order_Details_Extended>("Order_Details_Extended");
            builder.EntitySet<Order_Subtotals>("Order_Subtotals");
            builder.EntitySet<Orders_Qry>("Orders_Qry");
            builder.EntitySet<Product_Sales_for_1997>("Product_Sales_for_1997");
            builder.EntitySet<Products_Above_Average_Price>("Products_Above_Average_Price");
            builder.EntitySet<Products_by_Category>("Products_by_Category");
            builder.EntitySet<Sales_Totals_by_Amount>("Sales_Totals_by_Amount");
            builder.EntitySet<Summary_of_Sales_by_Quarter>("Summary_of_Sales_by_Quarter");
            builder.EntitySet<Summary_of_Sales_by_Year>("Summary_of_Sales_by_Year");
            

            //builder.GetEdmModel());
            HttpServer server = new HttpServer(GlobalConfiguration.Configuration);
            GlobalConfiguration.Configuration.Routes.MapODataServiceRoute(
                "ODataRoute",
                "odata",
                EdmBuilder.GetEdm<Northwind>(), //builder.GetEdmModel(), //GetEdmModel(new Northwind()),
                new DefaultODataPathHandler()
                {
                    
                },
                ODataRoutingConventions.CreateDefault(),
                new DefaultODataBatchHandler(server)
                {
                    ODataRouteName = "ODataRoute"
                });

             //GlobalConfiguration.Configuration.Routes.MapHttpBatchRoute("batch", )
        }

        public static IEdmModel GetEdmModel(DbContext context)
        {
            using (MemoryStream stream = new MemoryStream())
            {
                using (XmlWriter writer = XmlWriter.Create(stream))
                {
                    EdmxWriter.WriteEdmx(context, writer);
                    writer.Close();
                    stream.Seek(0, SeekOrigin.Begin);
                    using (XmlReader reader = XmlReader.Create(stream))
                    {
                        return Microsoft.Data.Edm.Csdl.EdmxReader.Parse(reader);
                    }
                }
            }
        }
    }
}