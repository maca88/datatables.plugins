using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data.Entity;
using System.Linq;
using System.Linq.Expressions;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Http.OData;
using System.Web.Http.OData.Batch;
using System.Web.Http.OData.Query;
using System.Web.UI;
using Model_Northwind_EF;
using NHibernate.Criterion;

namespace NorthBreeze.Controllers
{

    public abstract class ODataBaseController<T, TSet> : ODataController where TSet : DbSet<T> where T : class, new()
    {
        protected readonly Northwind _db = new Northwind();

        protected DbSet<T> DbSet { get; set; }
        protected PropertyInfo KeyPropertyInfo;

        protected ODataBaseController(Expression<Func<Northwind, TSet>> dbSetExpr)
        {
            DbSet = dbSetExpr.Compile()(_db);
            _db.Database.Log = s =>
            {
                Console.Write(s);
            };
            KeyPropertyInfo = typeof(T).GetProperties().First(o => o.GetCustomAttributes(typeof (KeyAttribute), true) != null);
        }

        [EnableQuery]
        public virtual IQueryable<T> Get(ODataQueryOptions<Customers> options)
        {
            return DbSet.AsQueryable();
        }
        
        public T Get([FromODataUri] int key)
        {
            var category = DbSet.Find(key);
            if (category == null)
            {
                throw new HttpResponseException(Request.CreateResponse(HttpStatusCode.NotFound));
            }

            return category;
        }

        [AcceptVerbs("PATCH", "MERGE")]
        public IHttpActionResult Patch(Delta<T> patch)
        {
            var key = KeyPropertyInfo.GetValue(patch.GetEntity());
            var entity = DbSet.Find(key);
            patch.Patch(entity);
            _db.SaveChanges();
            return Updated(entity);
        }
        

        public async Task<IHttpActionResult> Post([FromBody] T entity)
        {
            if (entity == null)
            {
                return BadRequest(ModelState);
            }
            var key = KeyPropertyInfo.GetValue(entity);
            var dbEntity = DbSet.Find(key);
            if (dbEntity == null)
            {
                DbSet.Add(entity);
                await _db.SaveChangesAsync();
                return Created(entity);
            }

            foreach (var prop in typeof (T).GetProperties().Where(o => o.GetSetMethod(true) != null))
            {
                prop.SetValue(dbEntity, prop.GetValue(entity));
            }
            return Updated(dbEntity); 
        }

        public async Task<IHttpActionResult> Put([FromODataUri] int key, [FromBody] T entity)
        {
            if (entity == null)
            {
                return BadRequest(ModelState);
            }
            var originalCustomer = await DbSet.FindAsync(key);
            if (originalCustomer == null)
            {
                return NotFound();
            }
            _db.Entry(originalCustomer).CurrentValues.SetValues(entity);
            await _db.SaveChangesAsync();
            return Updated(entity);
        }


        public async Task<IHttpActionResult> Delete([FromODataUri]int key)
        {
            var entity = await DbSet.FindAsync(key);
            if (entity == null)
            {
                return NotFound();
            }
            DbSet.Remove(entity);
            await _db.SaveChangesAsync();
            return StatusCode(HttpStatusCode.NoContent);
        }
        protected override void Dispose(bool disposing)
        {
            _db.Dispose();
            base.Dispose(disposing);
        }
    }

    public class OrdersController : ODataBaseController<Orders, DbSet<Orders>>
    {
        public OrdersController() : base(northwind => northwind.Orders)
        {
        }

        [EnableQuery]
        public IQueryable<Order_Details> GetOrder_Details([FromODataUri]int key)
        {
            return DbSet.Where(o => o.OrderID == key).SelectMany(o => o.Order_Details);
        }

        [EnableQuery]
        public IQueryable<Orders> GetFilteredOrders(ODataQueryOptions<Orders> options)
        {
            return DbSet;
        }
    }

    public class CustomersController : ODataBaseController<Customers, DbSet<Customers>>
    {
        public CustomersController()
            : base(northwind => northwind.Customers)
        {
        }

        [EnableQuery]
        public override IQueryable<Customers> Get(ODataQueryOptions<Customers> options)
        {
            var query = DbSet.AsQueryable();
            var settings = new ODataQuerySettings()
            {
            };
            var param = HttpUtility.ParseQueryString(options.Request.RequestUri.Query);

            var country = param.Get("country");
            if (!string.IsNullOrEmpty(country))
                query = query.Where(o => o.Country.Contains(country));

            var company = param.Get("company");
            if (!string.IsNullOrEmpty(company))
                query = query.Where(o => o.CompanyName.Contains(company));

            var contact = param.Get("contact");
            if (!string.IsNullOrEmpty(contact))
                query = query.Where(o => o.ContactName.Contains(contact));

            return query;
        }

    }
    
}