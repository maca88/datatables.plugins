using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Spatial;
using System.Web;
using System.Web.Http;
using System.Web.Http.OData;
using Model_Northwind_EF;

namespace NorthBreeze.Controllers
{
    public class CategoriesController : ODataBaseController<Categories, DbSet<Categories>>
    {
        public CategoriesController()
            : base(northwind => northwind.Categories)
        {
        }
    }
}